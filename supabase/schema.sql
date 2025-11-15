-- CarbonSight Supabase schema
-- Run this script in the Supabase SQL editor (or via supabase db push)
-- It defines core tables, enums, and row level security policies

-- Required extensions --------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- Enumerations ---------------------------------------------------------------
do $$
begin
    if not exists (select 1 from pg_type where typname = 'organization_type') then
        create type organization_type as enum ('company', 'regulator', 'public', 'partner', 'service');
    end if;

    if not exists (select 1 from pg_type where typname = 'visibility_level') then
        create type visibility_level as enum ('private', 'org', 'regulator', 'public');
    end if;

    if not exists (select 1 from pg_type where typname = 'priority_level') then
        create type priority_level as enum ('low', 'normal', 'urgent', 'critical');
    end if;

    if not exists (select 1 from pg_type where typname = 'compliance_status') then
        create type compliance_status as enum ('pending', 'in_progress', 'scheduled', 'completed', 'overdue');
    end if;

    if not exists (select 1 from pg_type where typname = 'recommendation_impact') then
        create type recommendation_impact as enum ('low', 'medium', 'high');
    end if;

    if not exists (select 1 from pg_type where typname = 'document_status') then
        create type document_status as enum ('pending', 'under_review', 'approved', 'rejected', 'archived');
    end if;

    if not exists (select 1 from pg_type where typname = 'alert_severity') then
        create type alert_severity as enum ('low', 'medium', 'high', 'critical');
    end if;

    if not exists (select 1 from pg_type where typname = 'alert_status') then
        create type alert_status as enum ('scheduled', 'pending', 'active', 'resolved', 'dismissed');
    end if;

    if not exists (select 1 from pg_type where typname = 'user_role_type') then
        create type user_role_type as enum ('company', 'regulator', 'public', 'admin', 'ai_service');
    end if;

    if not exists (select 1 from pg_type where typname = 'activity_type') then
        create type activity_type as enum (
            'report_submitted',
            'data_uploaded',
            'compliance_updated',
            'deadline_added',
            'maintenance_scheduled',
            'ai_recommendation',
            'manual_note'
        );
    end if;
end$$;

-- Core tables ----------------------------------------------------------------
create table if not exists organizations (
    id                  uuid primary key default uuid_generate_v4(),
    slug                citext not null unique,
    name                text not null,
    type                organization_type not null default 'company',
    industry_sector     text,
    region              text,
    description         text,
    headquarters        jsonb not null default '{}'::jsonb,
    metadata            jsonb not null default '{}'::jsonb,
    created_by          uuid references auth.users(id) on delete set null,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);
comment on table organizations is 'Top level companies / regulators / partners that own facilities';
comment on column organizations.headquarters is 'Structured address/location data (city, state, lat/lng, etc.)';

create table if not exists facilities (
    id                  uuid primary key default uuid_generate_v4(),
    org_id              uuid not null references organizations(id) on delete cascade,
    slug                citext unique,
    name                text not null,
    facility_type       text,
    address_line1       text,
    address_line2       text,
    city                text,
    state               text,
    postal_code         text,
    parish              text,
    latitude            numeric(10,6),
    longitude           numeric(10,6),
    status              text not null default 'optimal',
    visibility          visibility_level not null default 'private',
    capacity_metadata   jsonb not null default '{}'::jsonb,
    metadata            jsonb not null default '{}'::jsonb,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);
comment on table facilities is 'Individual operational facilities / plants tied to an organization';
create index if not exists idx_facilities_org on facilities(org_id);
create index if not exists idx_facilities_visibility on facilities(visibility);

create table if not exists facility_daily_emissions (
    id                  uuid primary key default uuid_generate_v4(),
    facility_id         uuid not null references facilities(id) on delete cascade,
    measurement_date    date not null,
    tons_co2            numeric(14,2) not null,
    measurement_type    text not null default 'actual',
    change_percent      numeric(6,2),
    notes               text,
    created_at          timestamptz not null default now()
);
comment on table facility_daily_emissions is 'Daily emissions readings per facility';
create unique index if not exists uq_facility_daily_emissions on facility_daily_emissions(facility_id, measurement_date);
create index if not exists idx_facility_daily_emissions_date on facility_daily_emissions(measurement_date desc);

create table if not exists emissions_aggregate (
    id                  uuid primary key default uuid_generate_v4(),
    org_id              uuid not null references organizations(id) on delete cascade,
    facility_id         uuid references facilities(id) on delete cascade,
    period_start        date not null,
    period_end          date not null,
    scope               text not null default 'facility',
    tons_co2_total      numeric(14,2) not null,
    tons_co2_target     numeric(14,2),
    variance_percent    numeric(6,2),
    metadata            jsonb not null default '{}'::jsonb,
    created_at          timestamptz not null default now()
);
create index if not exists idx_emissions_aggregate_period on emissions_aggregate(org_id, period_end desc);

create table if not exists compliance_tasks (
    id                  uuid primary key default uuid_generate_v4(),
    org_id              uuid not null references organizations(id) on delete cascade,
    facility_id         uuid references facilities(id) on delete set null,
    title               text not null,
    regulation          text,
    due_date            date not null,
    status              compliance_status not null default 'pending',
    priority            priority_level not null default 'normal',
    completion_percent  numeric(5,2) not null default 0,
    assigned_to         uuid references auth.users(id) on delete set null,
    metadata            jsonb not null default '{}'::jsonb,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);
comment on table compliance_tasks is 'Org or facility level compliance deliverables and workflow status';
create index if not exists idx_compliance_tasks_org on compliance_tasks(org_id);
create index if not exists idx_compliance_tasks_status on compliance_tasks(status);
create index if not exists idx_compliance_tasks_due on compliance_tasks(due_date);

create table if not exists compliance_reports (
    id                  uuid primary key default uuid_generate_v4(),
    org_id              uuid not null references organizations(id) on delete cascade,
    facility_id         uuid references facilities(id) on delete set null,
    reporting_period_start date not null,
    reporting_period_end   date not null,
    status              document_status not null default 'pending',
    submitted_by        uuid references auth.users(id) on delete set null,
    submitted_at        timestamptz,
    reviewed_by         uuid references auth.users(id) on delete set null,
    reviewed_at         timestamptz,
    storage_object_path text,
    notes               text,
    metadata            jsonb not null default '{}'::jsonb,
    created_at          timestamptz not null default now()
);
create index if not exists idx_compliance_reports_org on compliance_reports(org_id, reporting_period_end desc);

create table if not exists documents (
    id                  uuid primary key default uuid_generate_v4(),
    org_id              uuid not null references organizations(id) on delete cascade,
    facility_id         uuid references facilities(id) on delete set null,
    task_id             uuid references compliance_tasks(id) on delete cascade,
    name                text not null,
    document_type       text not null,
    status              document_status not null default 'pending',
    storage_object_path text,
    uploaded_by         uuid references auth.users(id) on delete set null,
    uploaded_at         timestamptz not null default now(),
    metadata            jsonb not null default '{}'::jsonb
);
create index if not exists idx_documents_org on documents(org_id);
create index if not exists idx_documents_status on documents(status);

create table if not exists alerts (
    id                  uuid primary key default uuid_generate_v4(),
    org_id              uuid not null references organizations(id) on delete cascade,
    facility_id         uuid references facilities(id) on delete set null,
    severity            alert_severity not null,
    status              alert_status not null default 'pending',
    title               text not null,
    description         text,
    detected_at         timestamptz not null default now(),
    acknowledged_at     timestamptz,
    resolved_at         timestamptz,
    metadata            jsonb not null default '{}'::jsonb
);
create index if not exists idx_alerts_org on alerts(org_id);
create index if not exists idx_alerts_status on alerts(status);

create table if not exists activities (
    id                  uuid primary key default uuid_generate_v4(),
    org_id              uuid not null references organizations(id) on delete cascade,
    facility_id         uuid references facilities(id) on delete set null,
    actor_id            uuid references auth.users(id) on delete set null,
    type                activity_type not null,
    title               text not null,
    description         text,
    metadata            jsonb not null default '{}'::jsonb,
    created_at          timestamptz not null default now()
);
create index if not exists idx_activities_org on activities(org_id, created_at desc);

create table if not exists recommendations (
    id                  uuid primary key default uuid_generate_v4(),
    org_id              uuid not null references organizations(id) on delete cascade,
    facility_id         uuid references facilities(id) on delete set null,
    title               text not null,
    description         text,
    impact              recommendation_impact not null default 'medium',
    category            text,
    estimated_reduction numeric(12,2),
    estimated_cost      numeric(12,2),
    timeline            text,
    compliance_impact   text,
    environmental_benefit text,
    is_implemented      boolean not null default false,
    is_ai_generated     boolean not null default true,
    metadata            jsonb not null default '{}'::jsonb,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);
create index if not exists idx_recommendations_org on recommendations(org_id);

create table if not exists ai_insights (
    id                  uuid primary key default uuid_generate_v4(),
    org_id              uuid not null references organizations(id) on delete cascade,
    facility_id         uuid references facilities(id) on delete set null,
    insight_type        text not null,
    headline            text not null,
    details             text,
    metadata            jsonb not null default '{}'::jsonb,
    created_at          timestamptz not null default now()
);

create table if not exists public_scorecards (
    id                  uuid primary key default uuid_generate_v4(),
    org_id              uuid not null references organizations(id) on delete cascade,
    reporting_period    daterange not null,
    summary             jsonb not null default '{}'::jsonb,
    published           boolean not null default false,
    published_at        timestamptz,
    created_at          timestamptz not null default now()
);

create table if not exists profiles (
    id                  uuid primary key references auth.users(id) on delete cascade,
    org_id              uuid references organizations(id) on delete set null,
    role                user_role_type not null default 'public',
    display_name        text,
    phone               text,
    avatar_url          text,
    metadata            jsonb not null default '{}'::jsonb,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);
comment on table profiles is 'App-specific metadata for Supabase auth users';
create index if not exists idx_profiles_org on profiles(org_id);
create index if not exists idx_profiles_role on profiles(role);

-- Row Level Security ---------------------------------------------------------
alter table organizations enable row level security;
alter table facilities enable row level security;
alter table facility_daily_emissions enable row level security;
alter table emissions_aggregate enable row level security;
alter table compliance_tasks enable row level security;
alter table compliance_reports enable row level security;
alter table documents enable row level security;
alter table alerts enable row level security;
alter table activities enable row level security;
alter table recommendations enable row level security;
alter table ai_insights enable row level security;
alter table public_scorecards enable row level security;
alter table profiles enable row level security;

-- Basic policies (customize as needed) ---------------------------------------
-- Organizations: everyone can read public data, org members can manage theirs
drop policy if exists organizations_read_public on organizations;
create policy organizations_read_public on organizations
    for select
    using (true);

drop policy if exists organizations_manage_own on organizations;
create policy organizations_manage_own on organizations
    for all
    using (
        auth.role() = 'service_role'
        or auth.uid() = created_by
        or auth.uid() in (
            select p.id from profiles p where p.org_id = organizations.id and p.role in ('admin', 'company')
        )
    )
    with check (
        auth.role() = 'service_role'
        or auth.uid() = created_by
        or auth.uid() in (
            select p.id from profiles p where p.org_id = organizations.id and p.role in ('admin', 'company')
        )
    );

-- Facilities: public visibility honored; members full access
drop policy if exists facilities_select_policy on facilities;
create policy facilities_select_policy on facilities
    for select
    using (
        visibility in ('public', 'regulator')
        or auth.role() = 'service_role'
        or auth.uid() in (
            select p.id from profiles p where p.org_id = facilities.org_id
        )
    );

drop policy if exists facilities_modify_policy on facilities;
create policy facilities_modify_policy on facilities
    for all
    using (
        auth.role() = 'service_role'
        or auth.uid() in (
            select p.id from profiles p where p.org_id = facilities.org_id and p.role in ('admin', 'company')
        )
    )
    with check (
        auth.role() = 'service_role'
        or auth.uid() in (
            select p.id from profiles p where p.org_id = facilities.org_id and p.role in ('admin', 'company')
        )
    );

-- Standard helper policy for org-scoped tables
drop policy if exists org_table_read_policy on facility_daily_emissions;
create policy org_table_read_policy on facility_daily_emissions
    for select
    using (
        auth.role() = 'service_role'
        or auth.uid() in (
            select p.id from profiles p where p.org_id = (
                select f.org_id from facilities f where f.id = facility_daily_emissions.facility_id
            )
        )
    );

drop policy if exists org_table_insert_policy on facility_daily_emissions;
create policy org_table_insert_policy on facility_daily_emissions
    for insert
    with check (
        auth.role() = 'service_role'
        or auth.uid() in (
            select p.id from profiles p where p.org_id = (
                select f.org_id from facilities f where f.id = facility_daily_emissions.facility_id
            ) and p.role in ('admin', 'company')
        )
    );

-- Apply similar policies to other org-scoped tables
do $$
declare
    table_record record;
begin
    for table_record in
        select unnest(array[
            'emissions_aggregate',
            'compliance_tasks',
            'compliance_reports',
            'documents',
            'alerts',
            'activities',
            'recommendations',
            'ai_insights',
            'public_scorecards'
        ]) as tbl
    loop
        execute format($policy$
            drop policy if exists %I_read_policy on %I;
            create policy %I_read_policy on %I
                for select
                using (
                    auth.role() = 'service_role'
                    or auth.uid() in (
                        select p.id from profiles p where p.org_id = %I.org_id
                    )
                );

            drop policy if exists %I_write_policy on %I;
            create policy %I_write_policy on %I
                for all
                using (
                    auth.role() = 'service_role'
                    or auth.uid() in (
                        select p.id from profiles p where p.org_id = %I.org_id and p.role in ('admin', 'company')
                    )
                )
                with check (
                    auth.role() = 'service_role'
                    or auth.uid() in (
                        select p.id from profiles p where p.org_id = %I.org_id and p.role in ('admin', 'company')
                    )
                );
        $policy$, table_record.tbl, table_record.tbl, table_record.tbl, table_record.tbl, table_record.tbl, table_record.tbl, table_record.tbl, table_record.tbl, table_record.tbl, table_record.tbl, table_record.tbl, table_record.tbl);
    end loop;
end$$;

-- Profiles policies
drop policy if exists profiles_self_read on profiles;
create policy profiles_self_read on profiles
    for select
    using (
        auth.role() = 'service_role'
        or auth.uid() = id
        or auth.uid() in (
            select p2.id
            from profiles p1
            join profiles p2 on p1.org_id = p2.org_id
            where p1.id = auth.uid()
        )
    );

drop policy if exists profiles_self_update on profiles;
create policy profiles_self_update on profiles
    for update using (auth.uid() = id)
    with check (auth.uid() = id);

drop policy if exists profiles_admin_manage on profiles;
create policy profiles_admin_manage on profiles
    for all
    using (
        auth.role() = 'service_role'
        or auth.uid() in (
            select p.id from profiles p where p.role = 'admin'
        )
    )
    with check (
        auth.role() = 'service_role'
        or auth.uid() in (
            select p.id from profiles p where p.role = 'admin'
        )
    );

-- Updated timestamps triggers -------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_organizations_updated_at
    before update on organizations
    for each row execute procedure set_updated_at();

create trigger trg_facilities_updated_at
    before update on facilities
    for each row execute procedure set_updated_at();

create trigger trg_compliance_tasks_updated_at
    before update on compliance_tasks
    for each row execute procedure set_updated_at();

create trigger trg_recommendations_updated_at
    before update on recommendations
    for each row execute procedure set_updated_at();

create trigger trg_profiles_updated_at
    before update on profiles
    for each row execute procedure set_updated_at();

