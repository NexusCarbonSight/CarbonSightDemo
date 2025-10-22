# CarbonSight - Quick Start Guide

## 🚀 Getting Started

This guide will help you set up and run the CarbonSight prototype application locally.

### Prerequisites

- **Python 3.11+** 
- **Node.js 18+** and npm
- **PostgreSQL 14+**
- Git

### Installation

#### 1. Clone or navigate to the project

```bash
cd "/Users/ibrahim/Downloads/CarbonSight 2/carbonsight-project"
```

#### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env and configure your database settings
# For local development with PostgreSQL:
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/carbonsight
```

#### 3. Database Setup

```bash
# Create PostgreSQL database
createdb carbonsight

# Or using psql:
psql postgres
CREATE DATABASE carbonsight;
\q

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Load sample data (recommended for demo)
# python manage.py loaddata sample_data.json
```

#### 4. Start Backend Server

```bash
python manage.py runserver
# Backend will run on http://localhost:8000
```

#### 5. Frontend Setup (New Terminal)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm start
# Frontend will open automatically at http://localhost:3000
```

### 🎯 Access the Application

- **Home Page**: http://localhost:3000
- **Company Dashboard**: http://localhost:3000/company
- **Public Dashboard**: http://localhost:3000/public
- **Regulator Dashboard**: http://localhost:3000/regulator
- **API**: http://localhost:8000/api/
- **Admin Panel**: http://localhost:8000/admin/

### 📊 Features Implemented

✅ **Home Page**
- Landing page with 3 portal options
- Company, Public, and Regulator access points
- Responsive design matching Figma

✅ **Company Dashboard**
- Emissions metrics display
- AI-powered recommendations
- Compliance status tracking
- Recent activity feed
- Facility monitoring

✅ **Public Dashboard**
- Statewide emissions data
- Interactive charts (line, pie, bar)
- Regional breakdowns
- Sector analysis

✅ **Regulator Dashboard**
- Multi-company oversight
- Compliance monitoring
- Active alerts system
- Tabbed interface (Overview, Companies, Submissions, Alerts)
- Trend analysis charts

### 🗄️ API Endpoints

**Authentication**
- `POST /api/auth/token/` - Get JWT token
- `POST /api/auth/token/refresh/` - Refresh token

**Companies**
- `GET/POST /api/companies/` - List/Create companies
- `GET/PUT/DELETE /api/companies/{id}/` - Company details

**Emissions**
- `GET/POST /api/emissions/data/` - Emissions data
- `GET/POST /api/emissions/activities/` - Activity log

**Compliance**
- `GET/POST /api/compliance/reports/` - Compliance reports
- `GET/POST /api/compliance/alerts/` - Alerts
- `GET/POST /api/compliance/recommendations/` - AI recommendations

**Users**
- `GET /api/users/me/` - Current user profile
- `POST /api/users/` - Register new user

### 🐳 Docker Setup (Alternative)

```bash
# Build and run with Docker Compose
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
```

### 🔧 Development Tips

**Backend**
- API documentation: Visit http://localhost:8000/api/ for browsable API
- Admin interface: http://localhost:8000/admin/
- Run tests: `python manage.py test`

**Frontend**
- Hot reload enabled - changes appear automatically
- Build for production: `npm run build`
- Styled to match Figma designs with dark theme

### 📝 Sample Data

The application includes sample data for:
- 5 companies (Tiger Industries, etc.)
- Multiple facilities per company
- Emissions data over time
- Compliance reports
- AI recommendations
- Activity logs
- Alerts

### 🌐 Azure Deployment

See `deployment/azure-deploy.md` for detailed Azure deployment instructions.

### 🔐 Default Credentials (After Creating Superuser)

- **Admin**: Use credentials you created with `createsuperuser`
- **API Access**: Use JWT authentication

### 🎨 Technology Stack

**Frontend**
- React 18
- React Router v6
- Recharts for data visualization
- Axios for API calls
- Modern CSS with gradients and animations

**Backend**
- Django 4.2
- Django REST Framework
- PostgreSQL
- JWT Authentication
- CORS enabled

**Deployment**
- Docker & Docker Compose
- Azure App Service ready
- Azure PostgreSQL compatible
- Static file serving with WhiteNoise

### 🐛 Troubleshooting

**Database Connection Issues**
- Ensure PostgreSQL is running
- Check database credentials in .env
- Verify database exists: `psql -l`

**Port Already in Use**
- Backend: Change port with `python manage.py runserver 8001`
- Frontend: Set PORT environment variable: `PORT=3001 npm start`

**Module Not Found**
- Backend: Ensure virtual environment is activated
- Frontend: Delete node_modules and run `npm install` again

**CORS Errors**
- Check CORS_ALLOWED_ORIGINS in backend settings
- Ensure frontend is accessing correct API URL

### 📬 Support

For questions or issues, please check the README.md or project documentation.

---

**Built for Louisiana's Clean Energy Future** 🌱
