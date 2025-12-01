"""
Scraper for climate / environmental regulation deadlines

Sources:
- US EPA "Key Program Dates & Contacts" (power sector, national) :contentReference[oaicite:2]{index=2}
- Louisiana DEQ "Air Enforcement" (Title V semiannual + annual reporting deadlines) :contentReference[oaicite:3]{index=3}

This script:
- Scrapes the sites above
- Normalizes them into a list of deadline records
- Writes them into a single JSON file (deadlines.json) for use by a web app
"""

import json
import os
import re
from datetime import date, datetime

import requests
from bs4 import BeautifulSoup
from dateutil import parser as dateparser

# --------------- CONFIG ---------------

EPA_KEY_DATES_URL = "https://www.epa.gov/power-sector/key-program-dates-contacts"
LDEQ_AIR_ENFORCEMENT_URL = "https://deq.louisiana.gov/page/air-enforcement"

# Where to write the JSON file (adjust to your project structure)

DEFAULT_OUTPUT_PATH = os.path.join(
    os.path.dirname(__file__),
    "..",            # up from scraper/
    "frontend",
    "public",
    "deadlines.json",
)


# --------------- UTILITIES ---------------

def fetch_html(url: str) -> BeautifulSoup:
    """Fetch a URL and return a BeautifulSoup HTML parser."""
    resp = requests.get(url, timeout=20)
    resp.raise_for_status()
    return BeautifulSoup(resp.text, "html.parser")


def safe_parse_date(date_text: str):
    """Parse a date string into ISO date (YYYY-MM-DD) or return None."""
    try:
        return dateparser.parse(date_text).date().isoformat()
    except Exception:
        return None


# --------------- SCRAPER: EPA KEY PROGRAM DATES (NATIONAL) ---------------

def scrape_epa_key_program_dates():
    """
    Scrape national key program dates (power sector) from EPA.

    The page lists entries that look like:

      2025 January 30, 2025 End of 4th quarter 2024 emissions reporting period

    We:
    - isolate the "Key Program Dates" section
    - scan text lines for patterns like "<year> <Month DD, YYYY> <event...>"
    - return a list of normalized deadline dicts
    """
    print(f"Scraping EPA key program dates from {EPA_KEY_DATES_URL} ...")
    soup = fetch_html(EPA_KEY_DATES_URL)

    full_text = soup.get_text("\n")
    # Narrow down to the Key Program Dates section to avoid extra noise
    # (if the structure changes, this may need tweaking)
    if "Key Program Dates" in full_text:
        section = full_text.split("Key Program Dates", 1)[1]
    elif "Key Program Dates" in full_text:
        section = full_text.split("Key Program Dates", 1)[1]
    else:
        section = full_text

    if "Business Center Contacts" in section:
        section = section.split("Business Center Contacts", 1)[0]

    lines = [ln.strip() for ln in section.splitlines() if ln.strip()]

    # Regex: Year (4 digits), then a date like "January 30, 2025", then the event text
    pattern = re.compile(
        r"^(?P<year>\d{4})\s+(?P<date_text>[A-Za-z]+\s+\d{1,2},\s*\d{4})(?P<event>.*)$"
    )

    deadlines = []

    for line in lines:
        m = pattern.match(line)
        if not m:
            continue

        year = m.group("year")
        date_text = m.group("date_text").strip()
        event_text = m.group("event").strip()

        iso_date = safe_parse_date(date_text)

        title = event_text or "EPA key program date"
        deadlines.append(
            {
                "source": "EPA Key Program Dates (Power Sector)",
                "source_url": EPA_KEY_DATES_URL,
                "jurisdiction": "US Federal",
                "title": title,
                "deadline_date": iso_date,
                "deadline_text": date_text,
                "raw_line": line,
            }
        )

    print(f"  Found {len(deadlines)} EPA deadlines.")
    return deadlines


# --------------- SCRAPER: LDEQ TITLE V DEADLINES (LOUISIANA) ---------------

def scrape_louisiana_title_v_deadlines():
    """
    Scrape recurring Title V reporting deadlines for Louisiana.

    From the LDEQ Air Enforcement page: :contentReference[oaicite:4]{index=4}
    - Semiannual monitoring reports are due by March 31 and September 30.
    - Annual compliance certification is due by March 31 for the preceding year.

    These are recurring deadlines. We map them to actual dates in the current year.
    """
    print(f"Scraping Louisiana Title V deadlines from {LDEQ_AIR_ENFORCEMENT_URL} ...")
    soup = fetch_html(LDEQ_AIR_ENFORCEMENT_URL)
    full_text = soup.get_text(" ")

    current_year = date.today().year

    # We'll create three recurring deadlines as explicit dates for the current year.
    march_31 = date(current_year, 3, 31).isoformat()
    sept_30 = date(current_year, 9, 30).isoformat()

    deadlines = []

    # Semiannual monitoring: March 31
    deadlines.append(
        {
            "source": "LDEQ Title V Semiannual Monitoring",
            "source_url": LDEQ_AIR_ENFORCEMENT_URL,
            "jurisdiction": "Louisiana",
            "title": "Title V Semiannual Monitoring Report (July–December period)",
            "deadline_date": march_31,
            "deadline_text": "March 31 each year",
            "raw_line": "Semiannual monitoring reports are due by March 31 and September 30.",  # from page text
        }
    )

    # Semiannual monitoring: September 30
    deadlines.append(
        {
            "source": "LDEQ Title V Semiannual Monitoring",
            "source_url": LDEQ_AIR_ENFORCEMENT_URL,
            "jurisdiction": "Louisiana",
            "title": "Title V Semiannual Monitoring Report (January–June period)",
            "deadline_date": sept_30,
            "deadline_text": "September 30 each year",
            "raw_line": "Semiannual monitoring reports are due by March 31 and September 30.",
        }
    )

    # Annual compliance certification: March 31
    deadlines.append(
        {
            "source": "LDEQ Title V Annual Compliance Certification",
            "source_url": LDEQ_AIR_ENFORCEMENT_URL,
            "jurisdiction": "Louisiana",
            "title": "Title V Annual Compliance Certification (for preceding calendar year)",
            "deadline_date": march_31,
            "deadline_text": "March 31 each year (for preceding year)",
            "raw_line": "Annual compliance certification is to be submitted by March 31 for the preceding calendar year.",
        }
    )

    print(f"  Created {len(deadlines)} Louisiana Title V recurring deadlines.")
    return deadlines


# --------------- MAIN: MERGE & WRITE JSON ---------------

def collect_all_deadlines():
    """
    Call all scrapers and merge their results into one list.
    """
    all_deadlines = []

    try:
        all_deadlines.extend(scrape_epa_key_program_dates())
    except Exception as e:
        print("Warning: failed to scrape EPA key program dates:", e)

    try:
        all_deadlines.extend(scrape_louisiana_title_v_deadlines())
    except Exception as e:
        print("Warning: failed to scrape Louisiana Title V deadlines:", e)

    # You can plug in additional scrapers here later, e.g.:
    # all_deadlines.extend(scrape_compliance_calendar_xyz())

    return all_deadlines


def write_deadlines_json(output_path: str = DEFAULT_OUTPUT_PATH):
    """
    Scrape all sources and write them to a JSON file for the web app to consume.
    """
    print("Collecting deadlines from all sources...")
    deadlines = collect_all_deadlines()

    payload = {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "count": len(deadlines),
        "deadlines": deadlines,
    }

    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Wrote {len(deadlines)} deadlines to {output_path}")


if __name__ == "__main__":
    # Allow overriding the output path via environment variable if desired
    output_path = os.environ.get("DEADLINES_OUTPUT_PATH", DEFAULT_OUTPUT_PATH)
    write_deadlines_json(output_path)
