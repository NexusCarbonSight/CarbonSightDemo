# CarbonSight Demo - Quick Start Guide

## ✅ Your Application is Ready!

### 🚀 What's Running:

**Backend (Django API)**
- URL: http://127.0.0.1:8000
- Admin Panel: http://127.0.0.1:8000/admin
- Database: SQLite (db.sqlite3) - No PostgreSQL setup needed!

**Frontend (React)**
- URL: http://localhost:3000
- Live and ready to use!

### 🔐 Admin Credentials

- **Username**: admin
- **Email**: admin@carbonsight.com
- **Password**: admin123

### 📱 Available Pages

1. **Home Page** (`/`)
   - Landing page with 3 portal options:
     - Company Portal
     - Public Data Portal
     - Regulator Portal

2. **Company Dashboard** (`/company`)
   - Emissions metrics and stats
   - AI-powered recommendations
   - Activity feed
   - Compliance tracking

3. **Public Dashboard** (`/public`)
   - Annual emissions trends (Line Chart)
   - Sector breakdown (Pie Chart)
   - Regional data (Bar Chart)

4. **Regulator Dashboard** (`/regulator`)
   - Tabbed interface (Overview, Companies, Submissions, Alerts)
   - Compliance monitoring
   - Emissions tracking charts

### 🎯 Quick Access

**Frontend**: Open http://localhost:3000 in your browser
**Backend API**: Test endpoints at http://127.0.0.1:8000/api/
**Admin Panel**: Manage data at http://127.0.0.1:8000/admin (login with credentials above)

### 📊 Current Setup

✅ **Database**: SQLite (file-based, no server needed)
✅ **Authentication**: JWT tokens configured
✅ **CORS**: Enabled for local development
✅ **Styling**: Dark theme with cyan/purple accents matching Figma
✅ **Charts**: Recharts library for data visualization

### 🔄 To Stop the Servers

Press `CONTROL-C` in the terminals running the backend and frontend.

### 🚀 To Restart Later

**Backend**:
```bash
cd "/Users/ibrahim/Downloads/CarbonSight 2/carbonsight-project/backend"
source venv/bin/activate
python manage.py runserver
```

**Frontend**:
```bash
cd "/Users/ibrahim/Downloads/CarbonSight 2/carbonsight-project/frontend"
npm start
```

### 📝 Next Steps for Demo

1. **Add Sample Data** (optional):
   - Use the Django admin panel to add companies, emissions data, etc.
   - Or I can generate a data fixture file with realistic demo data

2. **Test the API**:
   - Visit http://127.0.0.1:8000/api/companies/
   - Visit http://127.0.0.1:8000/api/emissions/
   - Visit http://127.0.0.1:8000/api/compliance/

3. **Customize**:
   - Update company names, metrics, or styling as needed
   - All data is stored in `backend/db.sqlite3`

### 🐛 Troubleshooting

**If frontend won't start**: Delete `node_modules` and run `npm install` again
**If backend fails**: Check that port 8000 isn't in use
**Database issues**: Delete `db.sqlite3` and run migrations again

### 📚 Project Structure

```
carbonsight-project/
├── backend/              # Django API
│   ├── users/           # User authentication
│   ├── companies/       # Company & facility management
│   ├── emissions/       # Emissions tracking
│   ├── compliance/      # Reports & recommendations
│   └── db.sqlite3       # Database file
└── frontend/            # React app
    └── src/pages/       # All 4 pages from Figma
```

---

**Your demo app is ready to show! 🎉**

Would you like me to generate sample data to populate the dashboards with realistic information?
