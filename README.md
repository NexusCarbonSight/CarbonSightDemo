# CarbonSight Demo – React + Supabase

CarbonSight is a Louisiana-focused emissions intelligence platform that runs entirely on **Supabase** for data, auth, and policies. The React frontend consumes Supabase directly, with real-time Climate TRACE API integration for emissions data.

CarbonSight was made by Jackson Descant, Ibrahim Alam, Chloe Gray, Serene Qasem, and William Hays for LSU's CSC 4330 Software Systems class and was a finalist for LA Nexus DevDays.

---

## Highlights

- **Company portal** – facility monitoring, compliance tasks, document management, and AI-powered recommendations via HuggingFace.
- **Regulator portal** – cross-organisation oversight with live submissions, alerts, and trends computed from Supabase data.
- **Public dashboard** – shareable scorecards and emissions trends with live Climate TRACE API data.
- **Auth** – Supabase email/password with Google OAuth, using `profiles` table for roles (`company`, `regulator`, `public`, `admin`).
- **Climate TRACE Integration** – Real-time emissions data from the Climate TRACE API for Louisiana facilities.

---

## Architecture

```
React (CRA) ─────────────────┐
                              │
Supabase Auth + Database ─────┼──→  Storage (documents bucket)
                              │
Climate TRACE API ────────────┤
                              │
HuggingFace AI ───────────────┘
```

- **Frontend**: React 18, React Router, Recharts, Supabase JS SDK.
- **Backend**: Supabase (Postgres + RLS policies).
- **External APIs**: Climate TRACE for emissions data, HuggingFace for AI recommendations.
- **Deployment**: Dockerfile builds static bundle served via Nginx.

---

## Getting Started

### 1. Provision Supabase

1. Create a Supabase project.
2. In the SQL editor run `supabase/schema.sql` then `supabase/seed.sql`.
3. Create a private storage bucket called `documents` for uploads.
4. From **Project Settings → API** copy the **anon** key for the React app.

### 2. Configure the React app

Create `frontend/.env.local`:

```
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhb...
REACT_APP_DEFAULT_ORG_SLUG=sasol-chemicals-la
REACT_APP_HUGGINGFACE_API_KEY=hf_...  
```

### 3. Install & run

```bash
cd frontend
npm install
npm start          # http://localhost:3000
```

To develop with Docker Compose:

```bash
REACT_APP_SUPABASE_URL=... \
REACT_APP_SUPABASE_ANON_KEY=... \
docker-compose up
```

---

## Climate TRACE Integration

The app integrates with the [Climate TRACE API](https://climatetrace.org) for real-time emissions data:

- **Company Dashboard**: `ClimateTraceData` component displays industry benchmarks, regional context, and sector analysis.
- **Public Dashboard**: `climateTraceApi` utility fetches Louisiana emissions data for visualizations.

### Seed Data Generation

Generate Supabase-ready inserts from Climate TRACE bulk downloads:

```bash
python supabase/scripts/prepare_louisiana_seed.py \
  --data-dir CSVData100year \
  --output supabase/derived/louisiana_seed.sql \
  --limit 12
```

---

## Regulatory Deadline Scraper

The `scraper/` directory contains a Python script that scrapes environmental regulation deadlines from:

- US EPA Key Program Dates
- Louisiana DEQ Air Enforcement

```bash
cd scraper
pip install -r requirments.txt
python scraper.py
```

Output is written to `frontend/public/deadlines.json`.

---

## Schema Overview

Core tables (see `supabase/schema.sql`):

- `organizations`, `facilities`
- `facility_daily_emissions`, `emissions_aggregate`
- `compliance_tasks`, `compliance_reports`, `documents`
- `alerts`, `activities`, `recommendations`, `ai_insights`
- `public_scorecards`
- `profiles` (extends `auth.users`)

All tables have row-level security enabled.

---

## Frontend Structure

```
frontend/src/
├── components/
│   ├── ClimateTraceData.js    # Climate TRACE API integration
│   └── ErrorBoundary.js       # Error handling wrapper
├── context/
│   └── AuthContext.js         # Supabase auth state management
├── hooks/
│   ├── useCompanyDashboardData.js
│   └── useRegulatorDashboardData.js
├── pages/
│   ├── HomePage.js            # Landing with portal selection
│   ├── CompanyDashboard.js    # Company emissions & compliance
│   ├── RegulatorDashboard.js  # Regulator oversight view
│   ├── PublicDashboard.js     # Public emissions data
│   ├── CompanySignIn.js       # Company authentication
│   └── RegulatorSignIn.js     # Regulator authentication
├── services/
│   └── huggingfaceService.js  # AI recommendation service
├── utils/
│   └── climateTraceApi.js     # Climate TRACE API client
└── lib/
    └── supabaseClient.js      # Supabase client config
```

---

## Demo Credentials

Create users via Supabase Auth and set their role in `profiles`:

- Company dashboard requires `profiles.role = 'company'` (or `admin`).
- Regulator dashboard requires `profiles.role = 'regulator'` (or `admin`).

---

## Repository Layout

```
frontend/          React application
supabase/          SQL schema, seeds, and helper scripts
scraper/           Regulatory deadline scraper
docker-compose.yml Dev container configuration
```

Schema details live in `supabase/README.md`.
