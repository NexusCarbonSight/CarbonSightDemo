# Supabase Setup for CarbonSight

This folder contains the SQL required to bootstrap a Supabase project for the CarbonSight demo.

## Files

- `schema.sql` – core tables, enums, triggers, and row-level security policies.
- `seed.sql` – sample data that mirrors the dashboards in the React app.

## Usage

1. **Create a Supabase project** in the dashboard (or initialise locally with `supabase start`).
2. Open the **SQL Editor** and run `schema.sql` first.  
   - This script is idempotent, so it is safe to re-run after modifications.
3. Run `seed.sql` to load demo data (optionally tweak slugs / values before executing).
4. Configure **Storage buckets** if you plan to upload documents:
   - Create a bucket named `documents`.
   - Set its access to “Private”.
   - Update the `documents.storage_object_path` column with `<bucket>/<path>` when uploading.
5. Create a **Service Role** key in Supabase and use it only from a secure server (for the future AI/job runner service). The React app should only use the anon/public API key.

## Environment Variables (React)

Create `frontend/.env.local` with:

```
REACT_APP_SUPABASE_URL=https://<your-project>.supabase.co
REACT_APP_SUPABASE_ANON_KEY=<anon-public-key>
REACT_APP_DEFAULT_ORG_SLUG=sasol-chemicals-la
```

Restart the dev server after changing env vars.

## Authentication & Profiles

- Supabase auth automatically manages `auth.users`.
- On first login, create a matching `profiles` row (the React app does this automatically if it does not find one).
- Roles used in `profiles.role`:
  - `company` – internal company staff.
  - `regulator` – government/regulator accounts.
  - `public` – public portal viewers.
  - `admin` – superuser for org setup.

## Missing / Optional Enhancements

- **Automated profile provisioning:** Set up Supabase Auth hooks or use a background function to ensure `profiles` rows exist immediately after sign-up.
- **Document storage policies:** Add Storage RLS policies to restrict `documents` bucket access to the owning org.
- **Edge Functions / Workers:** For future AI integrations, deploy Supabase Edge Functions or a Python service to interact with the `ai_insights` table.
- **Materialized views:** For heavy analytics, consider materialised rollups from `facility_daily_emissions` → `emissions_aggregate`.
- **Rate limiting & auditing:** Add audit tables and use Supabase Log Drains for compliance visibility.

## Resetting Demo Data

To wipe demo entries while leaving the schema intact:

```sql
delete from facility_daily_emissions where facility_id in (select id from facilities where org_id = (select id from organizations where slug = 'sasol-chemicals-la'));
delete from compliance_tasks where org_id = (select id from organizations where slug = 'sasol-chemicals-la');
delete from recommendations where org_id = (select id from organizations where slug = 'sasol-chemicals-la');
delete from activities where org_id = (select id from organizations where slug = 'sasol-chemicals-la');
delete from alerts where org_id = (select id from organizations where slug = 'sasol-chemicals-la');
delete from public_scorecards where org_id = (select id from organizations where slug = 'sasol-chemicals-la');
delete from facilities where org_id = (select id from organizations where slug = 'sasol-chemicals-la');
delete from organizations where slug = 'sasol-chemicals-la';
```

Then re-run `seed.sql`.

