"""
Prepare Supabase seed statements from Climate TRACE CSV downloads.

The script scans the CSVData100year directory, filters sources that fall within
Louisiana, computes 2024 emissions summaries, and emits an SQL snippet that can
be appended to supabase/seed.sql (or run directly in the Supabase SQL editor).

Usage:
    python supabase/scripts/prepare_louisiana_seed.py \
        --data-dir ../CSVData100year \
        --output supabase/derived/louisiana_seed.sql

The generated SQL includes `INSERT ... ON CONFLICT` statements so it can be
re-run safely after future Climate TRACE releases.
"""

from __future__ import annotations

import argparse
import calendar
import csv
import datetime as dt
import json
import math
import uuid
from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple

LOUISIANA_BOUNDS = {
    "min_lat": 28.5,
    "max_lat": 33.1,
    "min_lon": -93.9,
    "max_lon": -88.5,
}

SUPPORTED_GASES = {"co2e_100yr"}
PRIORITY_KEYWORDS = ["sasol", "lake charles"]

NAMESPACE = uuid.NAMESPACE_URL


def slugify(value: str) -> str:
    cleaned = "".join(ch.lower() if ch.isalnum() else "-" for ch in value.strip())
    while "--" in cleaned:
        cleaned = cleaned.replace("--", "-")
    return cleaned.strip("-")


def maybe_float(raw: str) -> Optional[float]:
    if raw is None or raw == "":
        return None
    try:
        return float(raw)
    except ValueError:
        return None


def parse_month(date_str: str) -> Optional[dt.date]:
    if not date_str:
        return None
    try:
        dt_value = dt.datetime.fromisoformat(date_str.strip())
        return dt.date(dt_value.year, dt_value.month, 1)
    except ValueError:
        return None


@dataclass
class EmissionRecord:
    month: dt.date
    quantity_tons: float


@dataclass
class Facility:
    source_id: str
    name: str
    sector: str
    subsector: str
    lat: float
    lon: float
    source_type: str
    reporting_entity: str
    records: List[EmissionRecord] = field(default_factory=list)

    # Populated later
    owner_name: Optional[str] = None

    def to_facility_id(self) -> uuid.UUID:
        return uuid.uuid5(NAMESPACE, f"facility:{self.source_id}")

    def to_org_slug(self) -> str:
        owner = (self.owner_name or self.reporting_entity or self.name).strip()
        return slugify(owner or self.name)

    def to_org_id(self) -> uuid.UUID:
        return uuid.uuid5(NAMESPACE, f"organization:{self.to_org_slug()}")

    def emissions_by_year(self) -> Dict[int, float]:
        totals: Dict[int, float] = defaultdict(float)
        for record in self.records:
            totals[record.month.year] += record.quantity_tons
        return totals

    def last_measurement(self) -> Optional[EmissionRecord]:
        if not self.records:
            return None
        return max(self.records, key=lambda rec: rec.month)

    def best_year(self) -> Optional[int]:
        totals = self.emissions_by_year()
        if not totals:
            return None
        for year in (2024, 2023, 2022, 2021):
            if totals.get(year, 0.0) > 0:
                return year
        # Fallback to the year with the highest emissions
        return max(totals, key=totals.get)


def in_louisiana(lat: Optional[float], lon: Optional[float]) -> bool:
    if lat is None or lon is None:
        return False
    return (
        LOUISIANA_BOUNDS["min_lat"] <= lat <= LOUISIANA_BOUNDS["max_lat"]
        and LOUISIANA_BOUNDS["min_lon"] <= lon <= LOUISIANA_BOUNDS["max_lon"]
    )


def load_facilities(data_dir: Path) -> Dict[str, Facility]:
    facilities: Dict[str, Facility] = {}
    source_files = sorted(data_dir.rglob("*_emissions_sources_v4_8_0.csv"))
    for csv_path in source_files:
        with csv_path.open("r", encoding="utf-8") as fh:
            reader = csv.DictReader(fh)
            for row in reader:
                if row.get("iso3_country") != "USA":
                    continue
                gas = row.get("gas")
                if gas not in SUPPORTED_GASES:
                    continue
                lat = maybe_float(row.get("lat"))
                lon = maybe_float(row.get("lon"))
                if not in_louisiana(lat, lon):
                    continue

                source_id = row["source_id"]
                facility = facilities.get(source_id)
                if not facility:
                    facility = Facility(
                        source_id=source_id,
                        name=row.get("source_name", "").strip() or f"Facility {source_id}",
                        sector=row.get("sector", "").strip(),
                        subsector=row.get("subsector", "").strip(),
                        lat=lat or 0.0,
                        lon=lon or 0.0,
                        source_type=row.get("source_type", "").strip(),
                        reporting_entity=row.get("reporting_entity", "").strip(),
                    )
                    facilities[source_id] = facility

                month = parse_month(row.get("start_time"))
                quantity = maybe_float(row.get("emissions_quantity"))
                if month and quantity is not None:
                    facility.records.append(EmissionRecord(month=month, quantity_tons=quantity))
    return facilities


def enrich_with_ownership(data_dir: Path, facilities: Dict[str, Facility]) -> None:
    best_share: Dict[str, float] = {}
    ownership_files = sorted(data_dir.rglob("*_emissions_sources_ownership_v4_8_0.csv"))
    for csv_path in ownership_files:
        with csv_path.open("r", encoding="utf-8") as fh:
            reader = csv.DictReader(fh)
            for row in reader:
                source_id = row.get("source_id")
                if not source_id or source_id not in facilities:
                    continue
                owner = row.get("parent_name") or row.get("immediate_source_owner")
                owner = owner.strip() if owner else None
                if not owner:
                    continue
                share = maybe_float(row.get("overall_share_percent") or "")
                facility = facilities[source_id]
                candidate_share = share if share is not None else 0.0
                if facility.owner_name is None or candidate_share > best_share.get(source_id, -1.0):
                    facility.owner_name = owner
                    best_share[source_id] = candidate_share


def filter_and_rank(facilities: Dict[str, Facility], limit: int = 12) -> List[Facility]:
    priority: List[Facility] = []
    others: List[Tuple[float, Facility]] = []
    priority_ids = set()

    for facility in facilities.values():
        if not facility.records:
            continue
        best_year = facility.best_year()
        if not best_year:
            continue
        total_for_year = facility.emissions_by_year().get(best_year, 0.0)
        name_lower = facility.name.lower()
        if any(keyword in name_lower for keyword in PRIORITY_KEYWORDS):
            if facility.source_id not in priority_ids:
                priority.append(facility)
                priority_ids.add(facility.source_id)
        else:
            others.append((total_for_year, facility))

    others.sort(key=lambda item: item[0], reverse=True)
    selected: List[Facility] = []
    included_ids = set()

    for facility in priority:
        if facility.source_id in included_ids:
            continue
        selected.append(facility)
        included_ids.add(facility.source_id)
        if len(selected) >= limit:
            return selected

    for _, facility in others:
        if facility.source_id in included_ids:
            continue
        selected.append(facility)
        included_ids.add(facility.source_id)
        if len(selected) >= limit:
            break

    return selected


def month_range(records: Iterable[EmissionRecord], year: int) -> List[EmissionRecord]:
    return [record for record in records if record.month.year == year]


def to_sql_value(value) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, (int, float)):
        if isinstance(value, float) and math.isnan(value):
            return "NULL"
        return str(value)
    return "'" + str(value).replace("'", "''") + "'"


def generate_sql(facilities: List[Facility]) -> str:
    lines: List[str] = []
    lines.append("-- Auto-generated by supabase/scripts/prepare_louisiana_seed.py")
    lines.append("begin;")
    lines.append("")

    # Organisations
    org_rows: Dict[str, Dict[str, object]] = {}
    for facility in facilities:
        slug = facility.to_org_slug()
        org_entry = org_rows.setdefault(
            slug,
            {
                "id": facility.to_org_id(),
                "name": facility.owner_name or facility.reporting_entity or facility.name,
                "industry_sector": facility.sector,
                "source_types": set(),
                "reporting_entities": set(),
            },
        )
        if facility.sector:
            org_entry["industry_sector"] = facility.sector
        if facility.source_type:
            org_entry["source_types"].add(facility.source_type)
        if facility.reporting_entity:
            org_entry["reporting_entities"].add(facility.reporting_entity)

    for slug, data in org_rows.items():
        metadata = {
            "source_types": sorted(data["source_types"]) if data["source_types"] else None,
            "reporting_entities": sorted(data["reporting_entities"]) if data["reporting_entities"] else None,
        }
        metadata = {k: v for k, v in metadata.items() if v}
        headquarters = {"state": "LA", "country": "USA"}
        lines.append(
            "insert into organizations (id, slug, name, type, industry_sector, region, description, headquarters, metadata, created_at, updated_at)"
        )
        lines.append(
            f"values ('{data['id']}', '{slug}', {to_sql_value(data['name'])}, 'company', {to_sql_value(data['industry_sector'])}, 'Louisiana', NULL, {to_sql_value(json.dumps(headquarters))}, {to_sql_value(json.dumps(metadata))}, now(), now())"
        )
        lines.append("on conflict (slug) do update set name = excluded.name, industry_sector = excluded.industry_sector, metadata = excluded.metadata;")
        lines.append("")

    # Facilities
    for facility in facilities:
        facility_id = facility.to_facility_id()
        org_id = facility.to_org_id()
        metadata = {
            "subsector": facility.subsector,
            "epa_or_state_id": facility.source_id,
        }
        facility_slug = slugify(facility.name)
        lines.append(
            "insert into facilities (id, org_id, slug, name, facility_type, latitude, longitude, metadata, visibility, created_at, updated_at)"
        )
        lines.append(
            f"values ('{facility_id}', '{org_id}', {to_sql_value(facility_slug)}, {to_sql_value(facility.name)}, {to_sql_value(facility.subsector or facility.sector)}, {to_sql_value(facility.lat)}, {to_sql_value(facility.lon)}, {to_sql_value(json.dumps(metadata))}, 'org', now(), now())"
        )
        lines.append(
            "on conflict (id) do update set name = excluded.name, facility_type = excluded.facility_type, latitude = excluded.latitude, longitude = excluded.longitude, metadata = excluded.metadata, visibility = excluded.visibility;"
        )
        lines.append("")

    # Emissions time-series (2024)
    for facility in facilities:
        facility_id = facility.to_facility_id()
        year = facility.best_year()
        if not year:
            continue
        records_for_year = month_range(facility.records, year)
        if not records_for_year:
            continue
        for record in records_for_year:
            days_in_month = calendar.monthrange(record.month.year, record.month.month)[1]
            tons_per_day = record.quantity_tons / days_in_month
            entry_id = uuid.uuid5(NAMESPACE, f"facility:{facility.source_id}:daily:{record.month.isoformat()}")
        lines.append(
            "insert into facility_daily_emissions (id, facility_id, measurement_date, tons_co2, measurement_type, created_at)"
        )
        lines.append(
            f"values ('{entry_id}', '{facility_id}', '{record.month.isoformat()}', {tons_per_day:.6f}, 'actual', now())"
        )
        lines.append(
            "on conflict (id) do update set tons_co2 = excluded.tons_co2, measurement_type = excluded.measurement_type;"
        )
        if records_for_year:
            lines.append("")

    # Aggregated emissions summary per facility (2024 totals)
    for facility in facilities:
        year = facility.best_year()
        if not year:
            continue
        totals = facility.emissions_by_year()
        total_for_year = totals.get(year, 0.0)
        if total_for_year <= 0:
            continue
        facility_id = facility.to_facility_id()
        agg_id = uuid.uuid5(NAMESPACE, f"facility:{facility.source_id}:aggregate:{year}")
        metadata = {
            "sector": facility.sector,
            "subsector": facility.subsector,
            "year": year,
        }
        lines.append(
            "insert into emissions_aggregate (id, org_id, facility_id, period_start, period_end, scope, tons_co2_total, metadata, created_at)"
        )
        lines.append(
            f"values ('{agg_id}', '{facility.to_org_id()}', '{facility_id}', '{year}-01-01', '{year}-12-31', 'facility', {total_for_year:.2f}, {to_sql_value(json.dumps(metadata))}, now())"
        )
        lines.append(
            "on conflict (id) do update set tons_co2_total = excluded.tons_co2_total, metadata = excluded.metadata;"
        )
        lines.append("")

    lines.append("commit;")
    lines.append("")
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description="Prepare Louisiana seed SQL from Climate TRACE CSVs.")
    parser.add_argument("--data-dir", type=Path, default=Path("../CSVData100year"), help="Path to CSVData100year directory")
    parser.add_argument("--output", type=Path, default=Path("supabase/derived/louisiana_seed.sql"), help="Where to write SQL output")
    parser.add_argument("--limit", type=int, default=12, help="Number of top-emitting facilities to include")
    args = parser.parse_args()

    data_dir = args.data_dir.resolve()
    if not data_dir.exists():
        raise SystemExit(f"Data directory not found: {data_dir}")

    facilities = load_facilities(data_dir / "DATA")
    if not facilities:
        raise SystemExit("No Louisiana facilities were identified. Check the data directory path.")

    enrich_with_ownership(data_dir / "DATA", facilities)
    shortlisted = filter_and_rank(facilities, limit=args.limit)
    if not shortlisted:
        raise SystemExit("Found Louisiana facilities, but no emissions records for 2023/2024 were detected.")

    output_sql = generate_sql(shortlisted)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(output_sql, encoding="utf-8")
    print(f"Generated SQL for {len(shortlisted)} facilities at {args.output}")


if __name__ == "__main__":
    main()

