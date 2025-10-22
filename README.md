# CarbonSight Demo - Louisiana Emissions Intelligence Platform

A comprehensive carbon dioxide tracking and reporting platform specifically designed for Louisiana's industrial facilities, featuring real-world emissions data integration through Climate TRACE API.

## 🌟 Features

### Company Portal
- **Real-time Emissions Tracking**: Monitor CO2 emissions across multiple facilities
- **Task Management**: Comprehensive task system with 5 categories (compliance, maintenance, optimization, training)
- **Document Management**: Upload and track compliance documents with regulatory review workflow
- **AI-Powered Insights**: Get intelligent recommendations for emissions reduction and operational optimization
- **Louisiana Emissions Intelligence**: Real-world emissions data from Climate TRACE satellite monitoring

### Regulator Portal  
- **Multi-Company Oversight**: Monitor compliance across all Louisiana industrial facilities
- **Document Review System**: Review and approve company submissions
- **Alert Management**: Handle compliance violations and monitoring alerts
- **Regional Analytics**: Louisiana-specific emissions analysis and benchmarking

### Real-World Data Integration
- **Climate TRACE API**: Satellite-based emissions monitoring data
- **Louisiana Focus**: Gulf Coast and Louisiana-specific facility filtering
- **Industry Benchmarking**: Compare against real industrial emissions data
- **Sector Analysis**: Multi-sector emissions comparison and statistics

## Tech Stack

- **Backend**: Django 4.2 + Django REST Framework
- **Frontend**: React 18 + React Router + Axios
- **Database**: PostgreSQL 14+
- **Charts**: Recharts
- **Deployment**: Azure (App Service + PostgreSQL)

## Setup Instructions

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py loaddata sample_data.json
python manage.py runserver
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

### Environment Variables

Create `.env` file in backend directory:

```
DATABASE_URL=postgresql://user:password@localhost:5432/carbonsight
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

## Azure Deployment

See `deployment/azure-deploy.md` for detailed deployment instructions.

## Project Overview

CarbonSight is designed to help Louisiana track and reduce carbon emissions from industrial facilities by providing:
- Real-time emissions monitoring
- Compliance tracking and reporting
- AI-powered optimization recommendations
- Public transparency and accountability
- Regulatory oversight tools
