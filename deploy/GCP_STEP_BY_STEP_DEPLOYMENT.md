# 🚀 CodeMentor AI Platform - Comprehensive GCP Deployment Guide

> **Complete step-by-step guide for deploying and debugging the CodeMentor AI Platform on Google Cloud Platform**

**Estimated Total Time:** 5-7 hours (first deployment)  
**Subsequent Deployments:** 1-2 hours

---

## 📋 Table of Contents

1. [STAGE 1: Prerequisites & Setup](#stage-1-prerequisites--setup-1-2-hours)
2. [STAGE 2: Fix Terraform](#stage-2-fix-terraform-30-minutes)
3. [STAGE 3: Build & Push Docker Images](#stage-3-build--push-docker-images-30-minutes---1-hour)
4. [STAGE 4: Deploy Infrastructure with Terraform](#stage-4-deploy-infrastructure-with-terraform-1-hour)
5. [STAGE 5: Deploy Services to Cloud Run](#stage-5-deploy-services-to-cloud-run-30-minutes)
6. [STAGE 6: Database & Storage Setup](#stage-6-database--storage-setup-30-minutes)
7. [STAGE 7: Health Checks & Verification](#stage-7-health-checks--verification-1-hour)
8. [STAGE 8: Configure LLM Providers](#stage-8-configure-llm-providers-30-minutes)
9. [STAGE 9: End-to-End Testing](#stage-9-end-to-end-testing-1-hour)
10. [STAGE 10: Troubleshooting Common Issues](#stage-10-troubleshooting-common-issues-reference)

---

## STAGE 1: Prerequisites & Setup (1-2 hours)

### 1.1 GCP Account Setup

**Prerequisites:**
- Google account
- Credit card for billing (free tier available)

**Steps:**

```bash
# Create a new GCP project
gcloud projects create codementor-ai-platform --name="CodeMentor AI Platform"

# List your billing accounts
gcloud billing accounts list

# Link billing to your project (replace BILLING_ACCOUNT_ID)
gcloud billing projects link codementor-ai-platform \
  --billing-account=BILLING_ACCOUNT_ID

# Set as default project
gcloud config set project codementor-ai-platform
```

**Verification:**
```bash
# Verify project is set
gcloud config get-value project
# Expected output: codementor-ai-platform

# Verify billing is linked
gcloud billing projects describe codementor-ai-platform
# Expected: billingAccountName should be set
```

✅ **Checkpoint:** Project created and billing enabled

---

### 1.2 gcloud CLI Installation and Configuration

**Install gcloud CLI:**

**On macOS:**
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

**On Linux:**
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

**On Windows:**
Download and run the installer from https://cloud.google.com/sdk/docs/install

**Initialize and authenticate:**
```bash
# Initialize gcloud
gcloud init

# Authenticate
gcloud auth login

# Set application default credentials
gcloud auth application-default login

# Verify authentication
gcloud auth list
```

**Verification:**
```bash
gcloud --version
# Expected: Google Cloud SDK version 450.0.0 or higher
```

✅ **Checkpoint:** gcloud CLI installed and authenticated

---

### 1.3 Required Tools Installation

#### Docker

**On macOS:**
```bash
# Install Docker Desktop
brew install --cask docker
# Launch Docker Desktop from Applications
```

**On Linux (Ubuntu/Debian):**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
# Log out and back in
```

**Verification:**
```bash
docker --version
# Expected: Docker version 24.0.0 or higher

docker run hello-world
# Expected: "Hello from Docker!" message
```

#### Terraform

**On macOS:**
```bash
brew tap hashicorp/tap
brew install hashicorp/tap/terraform
```

**On Linux:**
```bash
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install terraform
```

**Verification:**
```bash
terraform --version
# Expected: Terraform v1.5.0 or higher
```

#### Git

**Verification:**
```bash
git --version
# Expected: git version 2.30.0 or higher
```

✅ **Checkpoint:** All required tools installed

---

### 1.4 Service Account Creation

**Create deployer service account:**
```bash
# Create service account
gcloud iam service-accounts create codementor-deployer \
  --display-name="CodeMentor Deployer" \
  --description="Service account for deploying CodeMentor AI Platform"

# Get the service account email
export SA_EMAIL=$(gcloud iam service-accounts list \
  --filter="displayName:CodeMentor Deployer" \
  --format='value(email)')

echo "Service Account Email: $SA_EMAIL"
```

**Verification:**
```bash
gcloud iam service-accounts list | grep codementor
# Expected: codementor-deployer service account listed
```

✅ **Checkpoint:** Service account created

---

### 1.5 IAM Permissions Setup

**Grant necessary permissions:**
```bash
# Get project ID
export PROJECT_ID=$(gcloud config get-value project)

# Grant required roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/editor"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/artifactregistry.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/run.admin"
```

**Enable required APIs:**
```bash
gcloud services enable \
  cloudresourcemanager.googleapis.com \
  serviceusage.googleapis.com \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  compute.googleapis.com \
  iam.googleapis.com \
  aiplatform.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com
```

**Verification:**
```bash
# Check IAM policies
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:$SA_EMAIL" \
  --format="table(bindings.role)"

# Check enabled APIs
gcloud services list --enabled | grep -E "(run|build|artifact)"
# Expected: All required APIs enabled
```

✅ **Checkpoint:** IAM permissions configured and APIs enabled

---

### 1.6 GitHub Secrets Configuration

**Create service account key:**
```bash
# Create and download key
gcloud iam service-accounts keys create ~/codementor-deployer-key.json \
  --iam-account=$SA_EMAIL

# Display key for GitHub Secrets (copy this)
cat ~/codementor-deployer-key.json | base64

# IMPORTANT: Save this key securely and add to GitHub Secrets
```

**Add to GitHub repository:**

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secrets:

| Secret Name | Value | Source |
|-------------|-------|--------|
| `GCP_PROJECT_ID` | Your project ID | `gcloud config get-value project` |
| `GCP_CREDENTIALS` | Service account key JSON | Content of `~/codementor-deployer-key.json` |
| `GCP_REGION` | `us-central1` | Default region |

**Verification:**
- All three secrets should be visible in GitHub Actions secrets list
- Secret values should be hidden (only names visible)

✅ **Checkpoint:** GitHub Secrets configured

---

### 1.7 Clone Repository

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/codementor-ai-platform.git
cd codementor-ai-platform

# Create terraform.tfvars from template
cp infrastructure/terraform/terraform.tfvars.example infrastructure/terraform/terraform.tfvars

# Edit terraform.tfvars with your values
nano infrastructure/terraform/terraform.tfvars
```

**Required values in terraform.tfvars:**
```hcl
project_id      = "codementor-ai-platform"
project_name    = "CodeMentor AI Platform"
region          = "us-central1"
environment     = "production"
enable_vertex_ai = true
```

✅ **Checkpoint:** Repository cloned and configured

---

## STAGE 2: Fix Terraform (30 minutes)

### 2.1 Check for Duplicate Variables

The Terraform configuration should have variables defined only in `variables.tf`, not in `main.tf`.

**Automated fix:**
```bash
cd infrastructure/terraform
bash ../../deploy/scripts/fix-terraform.sh
```

**Manual fix (if needed):**

1. Check if `variables.tf` exists:
```bash
ls -la variables.tf
```

2. If it doesn't exist, create it and move variables from `main.tf`:
```bash
# Extract variable declarations from main.tf
grep -A 5 "^variable" main.tf > variables.tf

# Remove variable declarations from main.tf
# (Keep only provider, resource, and output blocks)
```

### 2.2 Validate Terraform Configuration

```bash
# Format Terraform files
terraform fmt -recursive

# Initialize Terraform
terraform init

# Validate configuration
terraform validate
```

**Expected output:**
```
Success! The configuration is valid.
```

### 2.3 Run Terraform Plan

```bash
terraform plan -out=tfplan
```

**Expected output:**
- Plan should show resources to be created
- No errors should appear
- Review the planned resources

**Common resources to be created:**
- Google Artifact Registry repository
- Service accounts (deployer, cloud-run, ai-engine)
- IAM bindings
- Cloud Run services (frontend, backend, ai-engine)

✅ **Checkpoint:** Terraform validated with no errors

---

## STAGE 3: Build & Push Docker Images (30 minutes - 1 hour)

### 3.1 Configure Docker for GCP

```bash
# Configure Docker to use gcloud for authentication
gcloud auth configure-docker us-central1-docker.pkg.dev
```

### 3.2 Build Frontend Image

```bash
cd /path/to/codementor-ai-platform

# Build Frontend
docker build -t us-central1-docker.pkg.dev/$PROJECT_ID/codementor-app/frontend:latest \
  -f frontend/Dockerfile \
  frontend/

# Verify image was built
docker images | grep frontend
```

**Expected output:**
```
us-central1-docker.pkg.dev/.../frontend   latest   <image-id>   <timestamp>   <size>
```

### 3.3 Build Backend Image

```bash
# Build Backend
docker build -t us-central1-docker.pkg.dev/$PROJECT_ID/codementor-app/backend:latest \
  -f backend/Dockerfile \
  backend/

# Verify image was built
docker images | grep backend
```

### 3.4 Build AI Engine Image

```bash
# Build AI Engine
docker build -t us-central1-docker.pkg.dev/$PROJECT_ID/codementor-app/ai-engine:latest \
  -f ai-engine/Dockerfile \
  ai-engine/

# Verify image was built
docker images | grep ai-engine
```

### 3.5 Push All Images to Artifact Registry

**Automated push (recommended):**
```bash
bash deploy/scripts/build-images.sh
```

**Manual push:**
```bash
# Push Frontend
docker push us-central1-docker.pkg.dev/$PROJECT_ID/codementor-app/frontend:latest

# Push Backend
docker push us-central1-docker.pkg.dev/$PROJECT_ID/codementor-app/backend:latest

# Push AI Engine
docker push us-central1-docker.pkg.dev/$PROJECT_ID/codementor-app/ai-engine:latest
```

### 3.6 Verify Images in Registry

```bash
# List images in Artifact Registry
gcloud artifacts docker images list \
  us-central1-docker.pkg.dev/$PROJECT_ID/codementor-app

# Expected output: All three images listed
```

✅ **Checkpoint:** All Docker images built and pushed to Artifact Registry

---

## STAGE 4: Deploy Infrastructure with Terraform (1 hour)

### 4.1 Review Terraform Plan

```bash
cd infrastructure/terraform

# Run terraform plan
terraform plan -out=tfplan

# Review the output carefully
# Expected resources:
# - Artifact Registry repository
# - Service Accounts (3)
# - IAM bindings
# - Cloud Run services (3)
```

### 4.2 Apply Terraform Configuration

```bash
# Apply the plan
terraform apply tfplan

# Or apply with auto-approve (use with caution)
terraform apply -auto-approve
```

**This will create:**
- ✅ Artifact Registry repository
- ✅ Service accounts for deployment and runtime
- ✅ IAM role bindings
- ✅ Cloud Run services (may fail initially if images not ready)

**Expected output:**
```
Apply complete! Resources: X added, 0 changed, 0 destroyed.

Outputs:

frontend_url = "https://codementor-frontend-xxx-uc.a.run.app"
backend_url = "https://codementor-backend-xxx-uc.a.run.app"
ai_engine_url = "https://codementor-ai-engine-xxx-uc.a.run.app"
...
```

### 4.3 Extract Service URLs

```bash
# Save all outputs to a file
terraform output -json > ../../deploy/terraform-outputs.json

# Extract individual URLs
export FRONTEND_URL=$(terraform output -raw frontend_url)
export BACKEND_URL=$(terraform output -raw backend_url)
export AI_ENGINE_URL=$(terraform output -raw ai_engine_url)

echo "Frontend URL: $FRONTEND_URL"
echo "Backend URL: $BACKEND_URL"
echo "AI Engine URL: $AI_ENGINE_URL"
```

### 4.4 Verify All Resources Created

```bash
# Check Cloud Run services
gcloud run services list --platform=managed

# Check Artifact Registry
gcloud artifacts repositories list

# Check Service Accounts
gcloud iam service-accounts list | grep codementor
```

✅ **Checkpoint:** Infrastructure deployed successfully

---

## STAGE 5: Deploy Services to Cloud Run (30 minutes)

### 5.1 Deploy Frontend Service

```bash
gcloud run deploy codementor-frontend \
  --image=us-central1-docker.pkg.dev/$PROJECT_ID/codementor-app/frontend:latest \
  --platform=managed \
  --region=us-central1 \
  --allow-unauthenticated \
  --set-env-vars="NEXT_PUBLIC_API_URL=$BACKEND_URL"
```

**Verification:**
```bash
curl -I $FRONTEND_URL
# Expected: HTTP/2 200 or 301/302
```

### 5.2 Deploy Backend Service

```bash
gcloud run deploy codementor-backend \
  --image=us-central1-docker.pkg.dev/$PROJECT_ID/codementor-app/backend:latest \
  --platform=managed \
  --region=us-central1 \
  --allow-unauthenticated \
  --set-env-vars="AI_ENGINE_URL=$AI_ENGINE_URL,NODE_ENV=production,PORT=8080"
```

**Verification:**
```bash
curl $BACKEND_URL/api/health
# Expected: {"status":"ok"} or similar
```

### 5.3 Deploy AI Engine Service

```bash
gcloud run deploy codementor-ai-engine \
  --image=us-central1-docker.pkg.dev/$PROJECT_ID/codementor-app/ai-engine:latest \
  --platform=managed \
  --region=us-central1 \
  --allow-unauthenticated \
  --set-env-vars="FLASK_ENV=production" \
  --memory=2Gi \
  --cpu=2
```

**Verification:**
```bash
curl $AI_ENGINE_URL/health
# Expected: {"status":"healthy"} or similar
```

### 5.4 Configure Service-to-Service Networking

**Allow Backend to call AI Engine:**
```bash
# Get the backend service account
BACKEND_SA=$(gcloud run services describe codementor-backend \
  --platform=managed \
  --region=us-central1 \
  --format='value(spec.template.spec.serviceAccountName)')

# Grant invoker role
gcloud run services add-iam-policy-binding codementor-ai-engine \
  --member="serviceAccount:$BACKEND_SA" \
  --role="roles/run.invoker" \
  --region=us-central1
```

### 5.5 Update Environment Variables

**Update Backend with correct AI Engine URL:**
```bash
gcloud run services update codementor-backend \
  --update-env-vars="AI_ENGINE_URL=$AI_ENGINE_URL" \
  --region=us-central1
```

**Update Frontend with correct Backend URL:**
```bash
gcloud run services update codementor-frontend \
  --update-env-vars="NEXT_PUBLIC_API_URL=$BACKEND_URL" \
  --region=us-central1
```

### 5.6 Verify Services Running

```bash
# List all services and their status
gcloud run services list --platform=managed --region=us-central1

# Check service details
bash deploy/scripts/debug-toolkit.sh
# Select option: "Check service status"
```

✅ **Checkpoint:** All services deployed and running

---

## STAGE 6: Database & Storage Setup (30 minutes)

### 6.1 Set up Cloud SQL (MongoDB) - Optional

**Note:** This stage is optional if you're using a different database solution.

```bash
# Create Cloud SQL instance (PostgreSQL example)
gcloud sql instances create codementor-db \
  --database-version=POSTGRES_14 \
  --tier=db-f1-micro \
  --region=us-central1

# Create database
gcloud sql databases create codementor \
  --instance=codementor-db

# Create user
gcloud sql users create codementor-user \
  --instance=codementor-db \
  --password=SECURE_PASSWORD
```

### 6.2 Configure Database Credentials

**Store credentials in Secret Manager:**
```bash
# Create secret for database URL
echo -n "postgresql://user:pass@host/db" | \
  gcloud secrets create db-connection-string --data-file=-

# Grant access to Backend service account
gcloud secrets add-iam-policy-binding db-connection-string \
  --member="serviceAccount:$BACKEND_SA" \
  --role="roles/secretmanager.secretAccessor"
```

### 6.3 Update Backend with Database URL

```bash
# Update Backend service
gcloud run services update codementor-backend \
  --update-secrets=DATABASE_URL=db-connection-string:latest \
  --region=us-central1
```

### 6.4 Test Database Connection

```bash
# Check Backend logs for database connection
gcloud run services logs read codementor-backend \
  --limit=50 \
  --region=us-central1 | grep -i database
```

✅ **Checkpoint:** Database setup and connected (if applicable)

---

## STAGE 7: Health Checks & Verification (1 hour)

### 7.1 Run Comprehensive Health Checks

```bash
bash deploy/scripts/health-checks.sh
```

This script will test:
- ✅ Frontend service health (HTTP 200)
- ✅ Backend API health (/api/health)
- ✅ AI Engine health (/health)
- ✅ Service-to-service communication
- ✅ Environment variable verification

### 7.2 Test Frontend Accessibility

```bash
# Test Frontend
curl -I $FRONTEND_URL
# Expected: HTTP/2 200

# Test in browser
open $FRONTEND_URL  # macOS
xdg-open $FRONTEND_URL  # Linux
```

### 7.3 Test Backend API Endpoints

```bash
# Health endpoint
curl $BACKEND_URL/api/health

# Test API endpoint
curl $BACKEND_URL/api/test
```

### 7.4 Test AI Engine Endpoints

```bash
# Health endpoint
curl $AI_ENGINE_URL/health

# Test provider endpoint
curl -X POST $AI_ENGINE_URL/api/providers/health \
  -H "Content-Type: application/json"
```

### 7.5 Test Service-to-Service Communication

```bash
# Test Backend → AI Engine communication
curl -X POST $BACKEND_URL/api/chat/test \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}'

# Expected: Response from AI Engine via Backend
```

### 7.6 Verify Environment Variables

```bash
# Check Backend environment variables
gcloud run services describe codementor-backend \
  --region=us-central1 \
  --format="value(spec.template.spec.containers[0].env)"

# Check Frontend environment variables
gcloud run services describe codementor-frontend \
  --region=us-central1 \
  --format="value(spec.template.spec.containers[0].env)"
```

### 7.7 Check Logs for Errors

```bash
# Backend logs
gcloud run services logs read codementor-backend \
  --limit=100 \
  --region=us-central1

# AI Engine logs
gcloud run services logs read codementor-ai-engine \
  --limit=100 \
  --region=us-central1

# Frontend logs
gcloud run services logs read codementor-frontend \
  --limit=100 \
  --region=us-central1
```

✅ **Checkpoint:** All health checks passing

---

## STAGE 8: Configure LLM Providers (30 minutes)

### 8.1 Configure Local Models Provider

The AI Engine supports local models via Ollama. Configuration is managed through environment variables.

**Update AI Engine service:**
```bash
gcloud run services update codementor-ai-engine \
  --update-env-vars="ENABLE_LOCAL_MODELS=true,OLLAMA_BASE_URL=http://localhost:11434" \
  --region=us-central1
```

### 8.2 Configure Google Gemini (Optional)

```bash
# Store API key in Secret Manager
echo -n "YOUR_GEMINI_API_KEY" | \
  gcloud secrets create gemini-api-key --data-file=-

# Grant access to AI Engine
gcloud secrets add-iam-policy-binding gemini-api-key \
  --member="serviceAccount:$(gcloud run services describe codementor-ai-engine \
    --region=us-central1 \
    --format='value(spec.template.spec.serviceAccountName)')" \
  --role="roles/secretmanager.secretAccessor"

# Update AI Engine
gcloud run services update codementor-ai-engine \
  --update-secrets=GEMINI_API_KEY=gemini-api-key:latest \
  --update-env-vars="ENABLE_GEMINI=true" \
  --region=us-central1
```

### 8.3 Configure OpenRouter (Optional)

```bash
# Store API key in Secret Manager
echo -n "YOUR_OPENROUTER_API_KEY" | \
  gcloud secrets create openrouter-api-key --data-file=-

# Grant access
gcloud secrets add-iam-policy-binding openrouter-api-key \
  --member="serviceAccount:$(gcloud run services describe codementor-ai-engine \
    --region=us-central1 \
    --format='value(spec.template.spec.serviceAccountName)')" \
  --role="roles/secretmanager.secretAccessor"

# Update AI Engine
gcloud run services update codementor-ai-engine \
  --update-secrets=OPENROUTER_API_KEY=openrouter-api-key:latest \
  --update-env-vars="ENABLE_OPENROUTER=true" \
  --region=us-central1
```

### 8.4 Test Provider Connections

```bash
# Test all providers
curl -X POST $AI_ENGINE_URL/api/providers/health \
  -H "Content-Type: application/json"

# Expected response:
# {
#   "local": "healthy",
#   "gemini": "healthy",
#   "openrouter": "healthy"
# }
```

✅ **Checkpoint:** LLM providers configured and tested

---

## STAGE 9: End-to-End Testing (1 hour)

### 9.1 Test Playground Page

```bash
# Open playground in browser
open "$FRONTEND_URL/playground"

# Manual tests:
# 1. Page loads without errors
# 2. UI components render correctly
# 3. Input field accepts text
# 4. Submit button is functional
```

### 9.2 Test AI Console Chat Functionality

**Test steps:**
1. Navigate to AI Console page
2. Enter a test message: "Hello, can you help me with Python?"
3. Click Send or press Enter
4. Verify response is received
5. Check that response is NOT "Connection failed"

**Debug if fails:**
```bash
# Check Backend logs
gcloud run services logs read codementor-backend --limit=50 | grep chat

# Check AI Engine logs
gcloud run services logs read codementor-ai-engine --limit=50
```

### 9.3 Test Code Review Functionality

**Test steps:**
1. Navigate to Code Review page
2. Paste sample code
3. Submit for review
4. Verify AI analysis is received
5. Check quality of feedback

### 9.4 Test All Three Providers

**For each provider (Local, Gemini, OpenRouter):**
```bash
# Test via API
curl -X POST $BACKEND_URL/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Write a hello world in Python",
    "provider": "local"
  }'

# Repeat for "gemini" and "openrouter"
```

### 9.5 Verify Real Responses from AI

**Acceptance criteria:**
- ✅ Responses are contextually relevant
- ✅ Responses are NOT error messages
- ✅ Response time is reasonable (< 10 seconds)
- ✅ Different providers give different response styles

### 9.6 Check Monitoring Dashboards

```bash
# Open Cloud Console
echo "https://console.cloud.google.com/run?project=$PROJECT_ID"

# Navigate to:
# 1. Cloud Run → Metrics tab
# 2. Check request count, latency, errors
# 3. Verify all services are receiving traffic
```

✅ **Checkpoint:** End-to-end functionality verified

---

## STAGE 10: Troubleshooting Common Issues (Reference)

### 10.1 Backend Can't Reach AI Engine

**Symptoms:**
- Backend returns "Connection failed" or timeout errors
- AI responses not generated

**Diagnosis:**
```bash
# Check Backend logs
gcloud run services logs read codementor-backend --limit=50 | grep -i "ai.engine\|error"

# Check environment variables
gcloud run services describe codementor-backend \
  --format="value(spec.template.spec.containers[0].env)" | grep AI_ENGINE
```

**Solutions:**
1. Verify AI_ENGINE_URL is correct:
```bash
# Get correct URL
AI_ENGINE_URL=$(terraform output -raw ai_engine_url)

# Update Backend
gcloud run services update codementor-backend \
  --update-env-vars="AI_ENGINE_URL=$AI_ENGINE_URL"
```

2. Check IAM permissions:
```bash
# Grant invoker role
gcloud run services add-iam-policy-binding codementor-ai-engine \
  --member="serviceAccount:$BACKEND_SA" \
  --role="roles/run.invoker"
```

### 10.2 AI Engine Models Not Loading

**Symptoms:**
- AI Engine health check fails
- "Model not found" errors in logs

**Diagnosis:**
```bash
# Check AI Engine logs
gcloud run services logs read codementor-ai-engine --limit=100
```

**Solutions:**
1. Increase memory and CPU:
```bash
gcloud run services update codementor-ai-engine \
  --memory=4Gi \
  --cpu=2
```

2. Check environment variables for model configuration

### 10.3 Database Connection Issues

**Symptoms:**
- Backend returns 500 errors
- "Database connection failed" in logs

**Solutions:**
1. Verify database credentials in Secret Manager
2. Check database instance is running:
```bash
gcloud sql instances list
```

3. Verify Cloud SQL connection:
```bash
gcloud sql connect codementor-db --user=codementor-user
```

### 10.4 Service Account Permission Issues

**Symptoms:**
- "Permission denied" errors
- "Unauthorized" errors

**Solutions:**
```bash
# List current IAM policies
gcloud projects get-iam-policy $PROJECT_ID

# Re-grant necessary permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/editor"
```

### 10.5 Terraform State Conflicts

**Symptoms:**
- "Resource already exists" errors
- Terraform state out of sync

**Solutions:**
1. Import existing resources:
```bash
terraform import google_cloud_run_service.frontend \
  projects/$PROJECT_ID/locations/us-central1/services/codementor-frontend
```

2. Or destroy and recreate:
```bash
terraform destroy -target=google_cloud_run_service.frontend
terraform apply
```

### 10.6 Environment Variable Issues

**Symptoms:**
- Variables not available in application
- "undefined" values in logs

**Solutions:**
1. List all environment variables:
```bash
gcloud run services describe SERVICE_NAME \
  --format="value(spec.template.spec.containers[0].env)"
```

2. Update variables:
```bash
gcloud run services update SERVICE_NAME \
  --update-env-vars="KEY=VALUE"
```

3. For secrets:
```bash
gcloud run services update SERVICE_NAME \
  --update-secrets="KEY=SECRET_NAME:latest"
```

---

## 📊 Deployment Summary

After successful completion, you should have:

✅ **Infrastructure:**
- GCP project with billing enabled
- All required APIs enabled
- Service accounts with proper IAM permissions
- Artifact Registry with Docker images

✅ **Services Running:**
- Frontend: Accessible at `$FRONTEND_URL`
- Backend: API at `$BACKEND_URL/api`
- AI Engine: Service at `$AI_ENGINE_URL`

✅ **Functionality:**
- Frontend loads and renders
- Backend API responds to requests
- AI Engine processes requests
- Service-to-service communication works
- LLM providers configured and tested
- Database connected (if applicable)

✅ **Monitoring:**
- Cloud Logging active
- Cloud Monitoring dashboards created
- Error tracking enabled

---

## 🔄 Next Steps

1. **Set up CI/CD:** Configure GitHub Actions for automated deployments
2. **Configure custom domain:** Add custom domain to Cloud Run services
3. **Set up monitoring alerts:** Create alerts for errors and high latency
4. **Implement caching:** Add Cloud CDN or Memorystore
5. **Security hardening:** Implement authentication, rate limiting
6. **Performance optimization:** Tune Cloud Run instances
7. **Backup strategy:** Set up database backups
8. **Cost optimization:** Review and optimize resource usage

---

## 📚 Additional Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Terraform GCP Provider](https://registry.terraform.io/providers/hashicorp/google/latest/docs)
- [Artifact Registry Guide](https://cloud.google.com/artifact-registry/docs)
- [Cloud Logging](https://cloud.google.com/logging/docs)
- [Troubleshooting Guide](./TROUBLESHOOTING_GUIDE.md)
- [Quick Reference](./QUICK_REFERENCE.md)

---

**Questions or issues?** Check the [Troubleshooting Guide](./TROUBLESHOOTING_GUIDE.md) or open an issue on GitHub.
