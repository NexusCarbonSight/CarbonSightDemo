# CarbonSight - Complete Project Structure

```
carbonsight-project/
│
├── README.md                          # Project overview and documentation
├── SETUP.md                           # Quick start guide
├── .gitignore                         # Git ignore file
├── docker-compose.yml                 # Docker compose configuration
│
├── backend/                           # Django Backend
│   ├── manage.py                      # Django management script
│   ├── requirements.txt               # Python dependencies
│   ├── Dockerfile                     # Backend Docker configuration
│   ├── .env.example                   # Environment variables template
│   │
│   ├── carbonsight/                   # Main Django project
│   │   ├── __init__.py
│   │   ├── settings.py                # Django settings (PostgreSQL, CORS, JWT)
│   │   ├── urls.py                    # URL routing
│   │   └── wsgi.py                    # WSGI configuration
│   │
│   ├── users/                         # User management app
│   │   ├── models.py                  # Custom User model with roles
│   │   ├── serializers.py             # User serializers
│   │   ├── views.py                   # User ViewSet
│   │   ├── urls.py                    # User endpoints
│   │   ├── admin.py                   # Admin configuration
│   │   └── apps.py
│   │
│   ├── companies/                     # Companies app
│   │   ├── models.py                  # Company & Facility models
│   │   ├── serializers.py             # Company serializers
│   │   ├── views.py                   # Company ViewSets
│   │   ├── urls.py                    # Company endpoints
│   │   ├── admin.py                   # Admin configuration
│   │   └── apps.py
│   │
│   ├── emissions/                     # Emissions tracking app
│   │   ├── models.py                  # EmissionData & Activity models
│   │   ├── serializers.py             # Emissions serializers
│   │   ├── views.py                   # Emissions ViewSets
│   │   ├── urls.py                    # Emissions endpoints
│   │   ├── admin.py                   # Admin configuration
│   │   └── apps.py
│   │
│   └── compliance/                    # Compliance app
│       ├── models.py                  # ComplianceReport, Alert, Recommendation models
│       ├── serializers.py             # Compliance serializers
│       ├── views.py                   # Compliance ViewSets
│       ├── urls.py                    # Compliance endpoints
│       ├── admin.py                   # Admin configuration
│       └── apps.py
│
├── frontend/                          # React Frontend
│   ├── package.json                   # npm dependencies
│   ├── Dockerfile                     # Frontend Docker configuration
│   ├── nginx.conf                     # Nginx configuration for production
│   ├── .env                           # Environment variables
│   │
│   ├── public/                        # Static assets
│   │   ├── index.html                 # HTML template
│   │   └── manifest.json              # PWA manifest
│   │
│   └── src/                           # React source code
│       ├── index.js                   # App entry point
│       ├── index.css                  # Global styles
│       ├── App.js                     # Main App component with routing
│       ├── App.css                    # App-level styles
│       │
│       └── pages/                     # Page components
│           ├── HomePage.js            # Landing page (3 portals)
│           ├── HomePage.css           # Home page styles
│           ├── CompanyDashboard.js    # Company dashboard
│           ├── CompanyDashboard.css   # Company dashboard styles
│           ├── PublicDashboard.js     # Public data dashboard
│           ├── PublicDashboard.css    # Public dashboard styles
│           ├── RegulatorDashboard.js  # Regulator oversight dashboard
│           └── RegulatorDashboard.css # Regulator dashboard styles
│
└── deployment/                        # Deployment configurations
    └── azure-deploy.md                # Azure deployment guide
```

## 🎯 Key Features by Page

### Home Page (`/`)
- Three portal access points with distinct styling
- Company Portal (Cyan gradient)
- Public Access (Blue gradient)
- Regulator Portal (Purple gradient)
- Responsive card-based design

### Company Dashboard (`/company`)
- **Metrics Cards**:
  - Emissions Rate (360,333 tons CO₂/day)
  - Areas Affected (3 facilities)
  - Compliance Status (94%)
  - Active Tasks (7 items)
  
- **AI Recommendations Section**:
  - High/Medium/Low impact cards
  - Optimize Plant C Operations
  - Schedule Preventive Maintenance
  - Update Q4 Targets
  
- **Recent Activity Feed**:
  - Time-stamped events
  - Color-coded by type

### Public Dashboard (`/public`)
- **Metrics Overview**:
  - Total Emissions 2024
  - Active Facilities (158)
  - Compliance Rate (96%)
  - Regions (5 major hubs)
  
- **Charts**:
  - Annual Emissions Trend (Line chart)
  - Emissions by Sector (Pie chart)
  - Regional Breakdown (Bar chart)

### Regulator Dashboard (`/regulator`)
- **Overview Metrics**:
  - Total Companies (5)
  - Total Emissions
  - Average Compliance (92%)
  - Active Alerts (3)
  
- **Tabbed Interface**:
  - Overview (company list)
  - Companies
  - Submissions
  - Alerts
  
- **Charts**:
  - Statewide Compliance Trend
  - Total Emissions Trend

## 🗄️ Database Models

### User
- Custom user with roles (company, regulator, public, admin)
- Linked to companies

### Company
- Name, address, region, industry sector
- Related facilities
- Calculated fields: total_emissions, compliance_rate

### Facility
- Belongs to company
- Facility type, capacity

### EmissionData
- Daily CO₂ measurements
- Linked to company/facility
- Measurement type (actual/estimated)

### ComplianceReport
- Status (compliant, needs attention, non-compliant)
- Reporting periods
- Document uploads

### Alert
- Severity levels
- Deadline tracking
- Resolution status

### Recommendation
- AI-powered suggestions
- Impact categorization
- Implementation tracking

### Activity
- Activity log
- Multiple activity types
- User attribution

## 🔌 API Endpoints

```
/api/auth/token/                    # JWT authentication
/api/auth/token/refresh/            # Token refresh
/api/users/                         # User management
/api/users/me/                      # Current user profile
/api/companies/                     # Companies CRUD
/api/companies/{id}/                # Company details
/api/companies/facilities/          # Facilities
/api/emissions/data/                # Emissions data
/api/emissions/activities/          # Activity log
/api/compliance/reports/            # Compliance reports
/api/compliance/alerts/             # Alerts
/api/compliance/recommendations/    # AI recommendations
```

## 🎨 Design Features

- **Dark Theme**: Navy blue (#0a0e27) background
- **Color Palette**:
  - Primary: Cyan (#34d3fd)
  - Secondary: Purple (#a78bfa)
  - Success: Green (#10b981)
  - Warning: Orange (#f59e0b)
  - Error: Red (#ef4444)
  
- **Components**:
  - Glassmorphic cards
  - Gradient buttons
  - Smooth animations
  - Responsive charts (Recharts)
  - Custom scrollbars
  
- **Typography**: System fonts with proper hierarchy

## 🚀 Deployment Ready

- ✅ PostgreSQL configured
- ✅ Docker & Docker Compose files
- ✅ Azure deployment guide
- ✅ Environment configuration
- ✅ Static file serving
- ✅ CORS enabled
- ✅ JWT authentication
- ✅ Production-ready Nginx config

## 📊 Data Visualization

- Line charts for trends
- Pie charts for sector breakdown
- Bar charts for regional analysis
- Interactive tooltips
- Responsive sizing
- Custom styling matching Figma

---

**Total Files Created**: 50+
**Lines of Code**: ~5,000+
**Tech Stack**: Django + React + PostgreSQL + Azure
