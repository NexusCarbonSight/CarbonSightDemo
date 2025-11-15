-- Sample data for CarbonSight demo environment
-- Execute after running schema.sql. Adjust slugs/IDs as needed for your project.

-- Upsert primary organization -------------------------------------------------
with org_upsert as (
    insert into organizations (slug, name, type, industry_sector, region, description, headquarters, metadata)
    values (
        'sasol-chemicals-la',
        'Sasol Chemicals (Louisiana)',
        'company',
        'Chemical Manufacturing / Petrochemicals',
        'Lake Charles, Louisiana',
        'Louisiana operations for Sasol Chemicals including Lake Charles complex and Sulfur Operations.',
        jsonb_build_object(
            'city', 'Lake Charles',
            'state', 'LA',
            'country', 'USA'
        ),
        jsonb_build_object(
            'website', 'https://www.sasolnorthamerica.com/',
            'email', 'info@sasol.com',
            'phone', '+1-337-555-0123',
            'is_active', true,
            'regions_served', jsonb_build_array('Calcasieu Parish', 'Southwest Louisiana')
        )
    )
    on conflict (slug)
    do update set
        name = excluded.name,
        industry_sector = excluded.industry_sector,
        region = excluded.region,
        metadata = organizations.metadata || excluded.metadata
    returning id
),
facility_data as (
    select id as org_id from org_upsert
),
facility_upsert as (
    insert into facilities (
        org_id, slug, name, facility_type, city, state, parish, latitude, longitude,
        status, visibility, capacity_metadata, metadata
    )
    select
        org_id,
        slug,
        name,
        facility_type,
        city,
        state,
        parish,
        latitude,
        longitude,
        status,
        visibility,
        capacity_metadata,
        metadata
    from (
        values
            (
                (select org_id from facility_data),
                'lake-charles-complex',
                'Lake Charles Complex',
                'Chemical Plant',
                'Westlake',
                'LA',
                'Calcasieu',
                30.2488,
                -93.2652,
                'optimal',
                'regulator',
                jsonb_build_object(
                    'capacity', '1.5M tons/year',
                    'primary_products', jsonb_build_array('Ethylene', 'Propylene', 'Mixed Alcohols')
                ),
                jsonb_build_object(
                    'nearby_zip_codes', jsonb_build_array('70669', '70611', '70605'),
                    'environmental_impact', 'Moderate - Active monitoring of nearby communities',
                    'operational_since', 2014,
                    'employees', 1200,
                    'air_quality_index', 45
                )
            ),
            (
                (select org_id from facility_data),
                'westlake-facility',
                'Westlake Facility',
                'Manufacturing',
                'Westlake',
                'LA',
                'Calcasieu',
                30.2350,
                -93.2700,
                'optimal',
                'regulator',
                jsonb_build_object(
                    'capacity', '1.2M tons/year',
                    'primary_products', jsonb_build_array('Linear Alpha Olefins', 'Detergent Alcohols')
                ),
                jsonb_build_object(
                    'nearby_zip_codes', jsonb_build_array('70669', '70615'),
                    'environmental_impact', 'Low - Best-in-class emissions control',
                    'operational_since', 2016,
                    'employees', 850,
                    'air_quality_index', 38
                )
            ),
            (
                (select org_id from facility_data),
                'sulfur-operations',
                'Sulfur Operations',
                'Sulfur Processing',
                'Westlake',
                'LA',
                'Calcasieu',
                30.2400,
                -93.2600,
                'needs_attention',
                'regulator',
                jsonb_build_object(
                    'capacity', '500K tons/year',
                    'primary_products', jsonb_build_array('Sulfur', 'Sulfuric Acid')
                ),
                jsonb_build_object(
                    'nearby_zip_codes', jsonb_build_array('70669'),
                    'environmental_impact', 'Elevated - Requires investigation',
                    'operational_since', 2015,
                    'employees', 320,
                    'air_quality_index', 62
                )
            )
    ) as f(org_id, slug, name, facility_type, city, state, parish, latitude, longitude, status, visibility, capacity_metadata, metadata)
    on conflict (slug)
    do update set
        status = excluded.status,
        metadata = facilities.metadata || excluded.metadata
    returning id, slug
),
facility_ids as (
    select
        (select id from facility_upsert where slug = 'lake-charles-complex') as lake_charles_id,
        (select id from facility_upsert where slug = 'westlake-facility') as westlake_id,
        (select id from facility_upsert where slug = 'sulfur-operations') as sulfur_id,
        (select org_id from facility_data) as org_id
)
-- Daily emissions records ----------------------------------------------------
insert into facility_daily_emissions (facility_id, measurement_date, tons_co2, measurement_type, change_percent, notes)
select
    facility_id,
    measurement_date,
    tons_co2,
    measurement_type,
    change_percent,
    notes
from (
    values
        ((select lake_charles_id from facility_ids), date '2024-10-18', 181200, 'actual', -5.2, 'Continuous monitoring data'),
        ((select lake_charles_id from facility_ids), date '2024-10-19', 180900, 'actual', -4.8, null),
        ((select lake_charles_id from facility_ids), date '2024-10-20', 180500, 'actual', -8.0, 'Optimization program impact'),

        ((select westlake_id from facility_ids), date '2024-10-18', 145800, 'actual', -12.0, null),
        ((select westlake_id from facility_ids), date '2024-10-19', 145400, 'actual', -13.2, 'Maintenance cycle completed'),
        ((select westlake_id from facility_ids), date '2024-10-20', 145200, 'actual', -15.0, null),

        ((select sulfur_id from facility_ids), date '2024-10-18', 34900, 'actual', 2.1, 'Slight increase due to throughput'),
        ((select sulfur_id from facility_ids), date '2024-10-19', 34750, 'actual', 3.8, null),
        ((select sulfur_id from facility_ids), date '2024-10-20', 34633, 'actual', 5.0, 'Trigger investigation for elevated readings')
) as e(facility_id, measurement_date, tons_co2, measurement_type, change_percent, notes)
on conflict (facility_id, measurement_date)
do update set
    tons_co2 = excluded.tons_co2,
    change_percent = excluded.change_percent,
    notes = excluded.notes;

-- Compliance tasks -----------------------------------------------------------
insert into compliance_tasks (id, org_id, facility_id, title, regulation, due_date, status, priority, completion_percent, metadata)
select
    coalesce(existing.id, uuid_generate_v4()),
    o.org_id,
    o.facility_id,
    t.title,
    t.regulation,
    t.due_date,
    t.status::compliance_status,
    t.priority::priority_level,
    t.completion_percent,
    t.metadata
from (
    values
        (
            'Q4 2024 Air Emissions Report',
            'Louisiana DEQ - LAC 33:III.Chapter 5',
            date '2025-01-15',
            'in_progress',
            'urgent',
            75.0,
            jsonb_build_object(
                'assigned_to', 'Environmental Compliance Team',
                'requirements', jsonb_build_array('Emissions data compilation', 'Third-party verification', 'DEQ submission portal upload')
            ),
            (select org_id from facility_ids),
            null
        ),
        (
            'Title V Operating Permit Renewal',
            'EPA Clean Air Act Title V',
            date '2025-02-01',
            'in_progress',
            'urgent',
            60.0,
            jsonb_build_object(
                'assigned_to', 'Regulatory Affairs',
                'requirements', jsonb_build_array('Updated facility diagrams', 'Emissions modeling report', 'Public notice documentation')
            ),
            (select org_id from facility_ids),
            null
        ),
        (
            'Louisiana DEQ Annual Operating Fee',
            'LAC 33:III.502',
            date '2025-03-31',
            'pending',
            'normal',
            0,
            jsonb_build_object(
                'assigned_to', 'Finance Department',
                'requirements', jsonb_build_array('Fee calculation worksheet', 'Payment authorization', 'Proof of payment')
            ),
            (select org_id from facility_ids),
            null
        ),
        (
            'EPA Greenhouse Gas Reporting',
            '40 CFR Part 98',
            date '2025-03-31',
            'pending',
            'normal',
            25,
            jsonb_build_object(
                'assigned_to', 'Environmental Compliance Team',
                'requirements', jsonb_build_array('GHG emissions calculation', 'e-GGRT system entry', 'XML file submission')
            ),
            (select org_id from facility_ids),
            null
        ),
        (
            'Sulfur Operations Stack Testing',
            'Louisiana DEQ Air Permit Condition 4.2',
            date '2025-04-15',
            'scheduled',
            'normal',
            10,
            jsonb_build_object(
                'assigned_to', 'Sulfur Operations Manager',
                'requirements', jsonb_build_array('Third-party testing contractor', 'Pre-test protocol', 'Stack test report')
            ),
            (select org_id from facility_ids),
            (select sulfur_id from facility_ids)
        )
) as t(title, regulation, due_date, status, priority, completion_percent, metadata, org_id, facility_id)
cross join lateral (
    select org_id, facility_id
) o
left join compliance_tasks existing
    on existing.org_id = o.org_id and existing.title = t.title
on conflict (id) do update
set
    due_date = excluded.due_date,
    status = excluded.status,
    completion_percent = excluded.completion_percent,
    metadata = excluded.metadata;

-- Recommendations ------------------------------------------------------------
insert into recommendations (id, org_id, facility_id, title, description, impact, category, estimated_reduction, estimated_cost, timeline, compliance_impact, environmental_benefit, metadata)
select
    coalesce(existing.id, uuid_generate_v4()),
    (select org_id from facility_ids),
    r.facility_id,
    r.title,
    r.description,
    r.impact::recommendation_impact,
    r.category,
    r.estimated_reduction,
    r.estimated_cost,
    r.timeline,
    r.compliance_impact,
    r.environmental_benefit,
    r.metadata
from (
    values
        (
            null,
            'high',
            'Transportation',
            'Optimize Transportation Fleet',
            'Transition to hybrid and electric vehicles for on-site transportation and material delivery.',
            1200,
            250000,
            '6-12 months',
            'Supports Louisiana Clean Energy Initiative; aligns with EPA reporting requirements.',
            'Eliminates ~1,200 tons of CO₂ annually; reduces NOx and particulate emissions.',
            jsonb_build_object('facility_scope', 'all')
        ),
        (
            (select id from facility_ids where facility_id = (select lake_charles_id from facility_ids)),
            'medium',
            'Energy Efficiency',
            'Implement Energy Management System',
            'Deploy an advanced EMS with real-time monitoring and AI-powered optimization.',
            800,
            300000,
            '8-10 months',
            'Aligns with Louisiana Act 517 and EPA Energy Star documentation.',
            'Reduces energy consumption spikes; supports regional energy stability.',
            jsonb_build_object('focus_area', 'Lake Charles Complex')
        ),
        (
            (select id from facility_ids where facility_id = (select westlake_id from facility_ids)),
            'high',
            'Renewable Energy',
            'Renewable Energy Transition',
            'Install on-site solar and secure wind energy procurement agreements.',
            2100,
            1850000,
            '12-18 months',
            'Positions org for future carbon pricing mechanisms; supports federal ITC incentives.',
            'Generates clean power equivalent to 300 homes; reduces reliance on fossil fuel-based grid power.',
            jsonb_build_object('facility_scope', 'Westlake Facility')
        )
) as r(facility_id, impact, category, title, description, estimated_reduction, estimated_cost, timeline, compliance_impact, environmental_benefit, metadata)
left join recommendations existing
    on existing.org_id = (select org_id from facility_ids)
   and existing.title = r.title
on conflict (id) do update set
    description = excluded.description,
    impact = excluded.impact,
    estimated_reduction = excluded.estimated_reduction,
    estimated_cost = excluded.estimated_cost,
    timeline = excluded.timeline,
    compliance_impact = excluded.compliance_impact,
    environmental_benefit = excluded.environmental_benefit,
    metadata = excluded.metadata;

-- Activities -----------------------------------------------------------------
insert into activities (org_id, facility_id, type, title, description, metadata)
select
    (select org_id from facility_ids),
    a.facility_id,
    a.type::activity_type,
    a.title,
    a.description,
    a.metadata
from (
    values
        (
            (select lake_charles_id from facility_ids),
            'data_uploaded',
            'Lake Charles emissions data uploaded to Louisiana DEQ portal',
            'Automated upload completed successfully.',
            jsonb_build_object('external_reference', 'DEQ-PORTAL-2024-10-20')
        ),
        (
            (select westlake_id from facility_ids),
            'report_submitted',
            'Westlake Facility - Monthly monitoring report approved',
            'Regulator confirmed report accuracy.',
            jsonb_build_object('review_status', 'approved')
        ),
        (
            (select lake_charles_id from facility_ids),
            'compliance_updated',
            'Title V permit renewal documentation submitted',
            'Waiting for regulator feedback.',
            jsonb_build_object('submission_id', 'TV-2024-Q4')
        ),
        (
            (select sulfur_id from facility_ids),
            'maintenance_scheduled',
            'Sulfur Operations - Elevated emissions alert triggered',
            'Investigation workflow started.',
            jsonb_build_object('priority', 'high')
        )
) as a(facility_id, type, title, description, metadata)
where not exists (
    select 1 from activities existing
    where existing.org_id = (select org_id from facility_ids)
      and existing.title = a.title
);

-- Alerts ---------------------------------------------------------------------
insert into alerts (org_id, facility_id, severity, status, title, description, metadata)
select
    (select org_id from facility_ids),
    al.facility_id,
    al.severity::alert_severity,
    al.status::alert_status,
    al.title,
    al.description,
    al.metadata
from (
    values
        (
            (select sulfur_id from facility_ids),
            'high',
            'active',
            'High Emissions',
            'CO₂ emissions exceeded daily limit by 15%',
            jsonb_build_object('detected_by', 'continuous_monitoring', 'recommended_actions', jsonb_build_array('Immediate investigation', 'Deploy response team'))
        ),
        (
            (select westlake_id from facility_ids),
            'medium',
            'pending',
            'Equipment Maintenance',
            'CEMS calibration due within 5 days.',
            jsonb_build_object('scheduled_date', '2024-11-01', 'responsible_team', 'Maintenance')
        )
) as al(facility_id, severity, status, title, description, metadata)
where not exists (
    select 1 from alerts existing
    where existing.org_id = (select org_id from facility_ids)
      and existing.title = al.title
);

-- Public scorecard snapshot --------------------------------------------------
insert into public_scorecards (org_id, reporting_period, summary, published, published_at)
values (
    (select org_id from facility_ids),
    daterange(date '2024-07-01', date '2024-09-30', '[]'),
    jsonb_build_object(
        'compliance_rate', 0.94,
        'daily_emissions_avg', 360333,
        'highlights', jsonb_build_array(
            '12% emissions reduction vs target',
            '94% compliance rate with Louisiana DEQ deadlines'
        ),
        'community_notes', jsonb_build_array(
            'Community engagement session scheduled for Jan 5, 2025',
            'Noise reduction initiative underway'
        )
    ),
    true,
    now()
)
on conflict (org_id, reporting_period)
do update set
    summary = excluded.summary,
    published = excluded.published,
    published_at = excluded.published_at;

