# Deploying CarbonSight to Azure

## Prerequisites

- Azure CLI installed
- Azure account with active subscription
- Docker installed (for containerization)

## Step 1: Create Azure Resources

```bash
# Login to Azure
az login

# Create resource group
az group create --name carbonsight-rg --location eastus

# Create PostgreSQL database
az postgres flexible-server create \
  --resource-group carbonsight-rg \
  --name carbonsight-db \
  --location eastus \
  --admin-user dbadmin \
  --admin-password <your-secure-password> \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 14

# Configure firewall to allow Azure services
az postgres flexible-server firewall-rule create \
  --resource-group carbonsight-rg \
  --name carbonsight-db \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

## Step 2: Create App Service for Backend

```bash
# Create App Service plan
az appservice plan create \
  --name carbonsight-plan \
  --resource-group carbonsight-rg \
  --sku B1 \
  --is-linux

# Create Web App
az webapp create \
  --resource-group carbonsight-rg \
  --plan carbonsight-plan \
  --name carbonsight-api \
  --runtime "PYTHON:3.11"

# Configure environment variables
az webapp config appsettings set \
  --resource-group carbonsight-rg \
  --name carbonsight-api \
  --settings \
    DATABASE_URL="postgresql://dbadmin:<password>@carbonsight-db.postgres.database.azure.com:5432/postgres" \
    SECRET_KEY="<your-secret-key>" \
    DEBUG="False" \
    ALLOWED_HOSTS="carbonsight-api.azurewebsites.net" \
    CORS_ALLOWED_ORIGINS="https://carbonsight-web.azurewebsites.net"
```

## Step 3: Deploy Backend

```bash
cd backend

# Create deployment zip
zip -r deploy.zip . -x "*.pyc" -x "__pycache__/*" -x "venv/*"

# Deploy to Azure
az webapp deployment source config-zip \
  --resource-group carbonsight-rg \
  --name carbonsight-api \
  --src deploy.zip

# Run migrations
az webapp ssh --resource-group carbonsight-rg --name carbonsight-api
python manage.py migrate
python manage.py loaddata sample_data.json
exit
```

## Step 4: Deploy Frontend (Static Web App)

```bash
# Create Static Web App
az staticwebapp create \
  --name carbonsight-web \
  --resource-group carbonsight-rg \
  --location eastus2

cd frontend

# Build for production
npm run build

# Deploy (using Azure Static Web Apps CLI)
npm install -g @azure/static-web-apps-cli
swa deploy ./build \
  --app-name carbonsight-web \
  --resource-group carbonsight-rg
```

## Alternative: Docker Deployment

### Backend Dockerfile
See `backend/Dockerfile`

### Frontend Dockerfile  
See `frontend/Dockerfile`

### Deploy using Container Instances

```bash
# Build and push images
docker build -t carbonsight-api:latest ./backend
docker build -t carbonsight-frontend:latest ./frontend

# Tag for Azure Container Registry
docker tag carbonsight-api:latest <your-acr>.azurecr.io/carbonsight-api:latest
docker tag carbonsight-frontend:latest <your-acr>.azurecr.io/carbonsight-frontend:latest

# Push to ACR
docker push <your-acr>.azurecr.io/carbonsight-api:latest
docker push <your-acr>.azurecr.io/carbonsight-frontend:latest
```

## Environment Variables Reference

### Backend (.env)
```
SECRET_KEY=<your-secret-key>
DEBUG=False
ALLOWED_HOSTS=.azurewebsites.net
DATABASE_URL=postgresql://user:password@host:5432/dbname
CORS_ALLOWED_ORIGINS=https://your-frontend.azurewebsites.net
```

### Frontend (.env.production)
```
REACT_APP_API_URL=https://carbonsight-api.azurewebsites.net/api
```

## Post-Deployment

1. Run database migrations
2. Create superuser: `python manage.py createsuperuser`
3. Load sample data: `python manage.py loaddata sample_data.json`
4. Test all endpoints
5. Configure custom domain (optional)

## Monitoring

```bash
# View logs
az webapp log tail --resource-group carbonsight-rg --name carbonsight-api

# Enable Application Insights
az monitor app-insights component create \
  --app carbonsight-insights \
  --location eastus \
  --resource-group carbonsight-rg
```
