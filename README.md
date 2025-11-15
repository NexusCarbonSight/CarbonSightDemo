# CarbonSight Demo – React + Supabase

CarbonSight is a Louisiana-focused emissions intelligence experience that now runs entirely on **Supabase** for data, auth, and policies. The React frontend consumes Supabase directly, while future AI/automation services can plug into the same backend via the service role key.

---

## Highlights

- **Company portal** – facility monitoring, compliance tasks, document management, and AI recommendations sourced from Supabase tables.
- **Regulator portal** – cross-organisation oversight with live submissions, alerts, and trends computed from Supabase data.
- **Public dashboard** – shareable scorecards and emissions trends (extensible via Supabase views/materialised reports).
- **Auth** – Supabase email/password with `profiles` table for roles (`company`, `regulator`, `public`, `admin`).
- **Data-first** – a Postgres schema modelled for facilities, emissions, compliance, documents, activities, and AI insights. All SQL lives in `supabase/schema.sql`, with Louisiana-specific seeds generated from the public Climate TRACE dataset.

---

## Architecture

```
React (CRA) ───────────────┐
                            │
Supabase Auth + Database ───┼──→  Storage (documents bucket, optional)
                            │
Future AI / Python services ┘
```

- **Frontend**: React 18, React Router, Recharts, Supabase JS SDK.
- **Backend**: Supabase (Postgres + policies). No Django server required.
- **CI/CD**: build the React app (Dockerfile provided) and deploy static assets; configure Supabase separately.

---

## Getting Started

### 1. Provision Supabase

1. Create a Supabase project.
2. In the SQL editor run `supabase/schema.sql` then `supabase/seed.sql` (optional if you want the base demo content).
3. (Optional) create a private storage bucket called `documents` for uploads.
4. From **Project Settings → API** copy the **anon** and **service_role** keys. Only the anon key goes into the React app.

### 2. Configure the React app

Create `frontend/.env.local`:

```
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhb...
REACT_APP_DEFAULT_ORG_SLUG=sasol-chemicals-la
```

### 3. Install & run

```bash
cd frontend
npm install
npm start          # http://localhost:3000
```

To develop with Docker Compose (dev server + hot reload):

```bash
REACT_APP_SUPABASE_URL=... \
REACT_APP_SUPABASE_ANON_KEY=... \
docker-compose up
```

The production Dockerfile builds the static bundle with CRA and serves via Nginx.

---

## Climate TRACE Seeds

- The Climate TRACE bulk downloads (free, Creative Commons 4.0) power the Louisiana demo content. Place the extracted sector CSVs under `CSVData100year/` (not committed to git).
- Generate Supabase-ready inserts with:

  ```bash
  python supabase/scripts/prepare_louisiana_seed.py \
    --data-dir CSVData100year \
    --output supabase/derived/louisiana_seed.sql \
    --limit 12
  ```

- Paste the contents of `supabase/derived/louisiana_seed.sql` into the Supabase SQL editor (after `schema.sql`) to load the top Louisiana facilities, emissions series, and aggregates. Regenerate whenever Climate TRACE releases new data.
- To keep the repo lean, commit only the script and derived SQL—leave the raw CSV bundle out of version control.

---

## Schema Overview

Core tables (see `supabase/schema.sql` for full DDL & policies):

- `organizations`, `facilities`
- `facility_daily_emissions`, `emissions_aggregate`
- `compliance_tasks`, `compliance_reports`, `documents`
- `alerts`, `activities`, `recommendations`, `ai_insights`
- `public_scorecards`
- `profiles` (extends `auth.users`)

All tables have row-level security enabled. Policies allow public reads where appropriate, while organisation members and regulators get scoped access. The included SQL is idempotent so it can be re-run safely.

---

## Frontend Data Flow

- `AuthContext` wraps Supabase auth, manages sessions, and auto-provisions `profiles` rows.
- `useCompanyDashboardData` and `useRegulatorDashboardData` fetch Supabase data, merge it with demo defaults, and expose consistent structures to existing UI components.
- Sign-in screens now call `supabase.auth.signInWithPassword` and validate against `profiles.role` before routing.

---

## Demo Credentials

Create users via Supabase Auth and set their role in `profiles`:

- Company dashboard requires `profiles.role = 'company'` (or `admin`).
- Regulator dashboard requires `profiles.role = 'regulator'` (or `admin`).  
Use the seed data as a reference for expectations.

---

## Future Extensions

- Supabase Edge Functions or a Python/FastAPI service (using the service role key) for AI workflows and scheduled analytics.
- Storage bucket policies to restrict document access per organisation.
- Materialised views for heavy analytics and public dashboards.
- Automated profile provisioning via Supabase auth hooks.

---

## Repository Layout

```
frontend/          React application
supabase/          SQL schema + seed data + docs
docker-compose.yml Dev container for CRA + Supabase vars
deployment/        Existing Azure notes (update as needed)
```

For onboarding guidance see `SETUP.md`. Schema details live in `supabase/README.md`.
