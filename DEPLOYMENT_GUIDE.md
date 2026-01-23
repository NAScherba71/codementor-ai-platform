# GCP Deployment Guide

This guide provides step-by-step instructions for deploying the CodeMentor AI Platform to Google Cloud Platform (GCP).

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Automated Deployment](#automated-deployment)
4. [Manual Deployment](#manual-deployment)
5. [Post-Deployment](#post-deployment)
6. [Monitoring and Maintenance](#monitoring-and-maintenance)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

- **Google Cloud Account** with billing enabled
- **gcloud CLI** installed and configured ([Install Guide](https://cloud.google.com/sdk/docs/install))
- **Docker** installed ([Install Guide](https://docs.docker.com/get-docker/))
- **Terraform** >= 1.5.0 installed ([Install Guide](https://learn.hashicorp.com/tutorials/terraform/install-cli))
- **Git** for cloning the repository
- Appropriate **GCP permissions** (Owner or Editor role recommended)

## Initial Setup

### 1. Create a GCP Project

```bash
# Create a new project
gcloud projects create YOUR_PROJECT_ID --name="CodeMentor AI Platform"

# Set billing account (replace with your billing account ID)
gcloud billing projects link YOUR_PROJECT_ID --billing-account=BILLING_ACCOUNT_ID

# Set as active project
gcloud config set project YOUR_PROJECT_ID
```

### 2. Enable Required APIs

The deployment script will enable these automatically, but you can do it manually:

```bash
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  aiplatform.googleapis.com \
  ml.googleapis.com
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```bash
# GCP Configuration
GCP_PROJECT_ID=your-project-id
GCP_REGION=us-central1
ENVIRONMENT=production

# AI Model Configuration (Optional - uses defaults if not set)
CLAUDE_MODEL=claude-sonnet-4.5
GPT_MODEL=gpt-5.2-codex
GEMINI_FLASH_MODEL=gemini-3-flash

# Vertex AI (Optional)
ENABLE_VERTEX_AI=true
```

## Automated Deployment

The easiest way to deploy is using our automated deployment script:

### Quick Start

```bash
# Make sure you're in the project root
cd /path/to/codementor-ai-platform

# Run the deployment script
./scripts/deploy-gcp.sh
```

The script will:

1. ✅ Check prerequisites (gcloud, docker, terraform)
2. ✅ Load environment variables
3. ✅ Configure GCP project
4. ✅ Build Docker images using Cloud Build
5. ✅ Push images to Artifact Registry
6. ✅ Deploy infrastructure with Terraform
7. ✅ Display service URLs and status

### What Happens During Deployment

#### Phase 1: Image Building (5-10 minutes)

```
Building and Pushing Docker Images
├── Frontend (Next.js)  → us-central1-docker.pkg.dev/PROJECT/app/frontend:latest
├── Backend (Node.js)   → us-central1-docker.pkg.dev/PROJECT/app/backend:latest
└── AI Engine (Python)  → us-central1-docker.pkg.dev/PROJECT/app/ai-engine:latest
```

#### Phase 2: Infrastructure Deployment (3-5 minutes)

```
Deploying Infrastructure with Terraform
├── Artifact Registry
├── Service Accounts (deployer, cloud-run, ai-engine)
├── IAM Bindings
├── Secret Manager
├── Cloud Run Services
│   ├── Frontend (min: 0, max: 10 instances)
│   ├── Backend (min: 0, max: 10 instances)
│   └── AI Engine (min: 0, max: 10 instances)
└── Public Access Configuration
```

## Manual Deployment

If you prefer manual control or need to troubleshoot:

### Step 1: Build Images Locally

```bash
# Frontend
cd frontend
gcloud builds submit --tag=us-central1-docker.pkg.dev/PROJECT_ID/app/frontend:latest

# Backend
cd ../backend
gcloud builds submit --tag=us-central1-docker.pkg.dev/PROJECT_ID/app/backend:latest

# AI Engine
cd ../ai-engine
gcloud builds submit --tag=us-central1-docker.pkg.dev/PROJECT_ID/app/ai-engine:latest
```

### Step 2: Deploy with Terraform

```bash
cd infrastructure/terraform

# Initialize Terraform
terraform init

# Create terraform.tfvars
cat > terraform.tfvars <<EOF
project_id       = "your-project-id"
region           = "us-central1"
environment      = "production"
enable_vertex_ai = true
EOF

# Plan and apply
terraform plan -out=tfplan
terraform apply tfplan
```

### Step 3: Verify Deployment

```bash
# Check service status
gcloud run services list --region=us-central1

# Get service URLs
terraform output
```

## Post-Deployment

### 1. Verify Services

Test each service endpoint:

```bash
# Frontend
curl https://codementor-frontend-PROJECT_ID.us-central1.run.app

# Frontend health check (includes backend connectivity test)
curl https://codementor-frontend-PROJECT_ID.us-central1.run.app/api/health

# Backend health check
curl https://codementor-backend-PROJECT_ID.us-central1.run.app/health

# AI Engine health check
curl https://codementor-ai-engine-PROJECT_ID.us-central1.run.app/health
```

**Expected frontend health check response:**
```json
{
  "status": "healthy",
  "frontend": "healthy",
  "backend": "healthy",
  "backend_url": "https://codementor-backend-xxx.run.app",
  "is_configured": true,
  "checks": {
    "backend_reachable": true
  }
}
```

⚠️ **If you see `"is_configured": false`** or `"backend": "unreachable"`, follow the troubleshooting steps in section [4. "Failed to analyze code: 500" Error](#4-failed-to-analyze-code-500-error).

### 2. Configure Secrets

Set up required secrets in Secret Manager:

```bash
# Database URL (if applicable)
echo -n "postgresql://..." | gcloud secrets create database-url --data-file=-

# JWT Secret
echo -n "your-jwt-secret" | gcloud secrets create jwt-secret --data-file=-

# API Keys (if needed)
echo -n "your-api-key" | gcloud secrets create api-key --data-file=-
```

### 3. Set Up Custom Domain (Optional)

```bash
# Map custom domain to Cloud Run service
gcloud run domain-mappings create \
  --service=codementor-frontend \
  --domain=yourdomain.com \
  --region=us-central1
```

## Monitoring and Maintenance

### View Logs

```bash
# Real-time logs
gcloud run services logs tail codementor-frontend --region=us-central1

# Recent logs
gcloud run services logs read codementor-backend --limit=100 --region=us-central1
```

### Monitor Resources

```bash
# Service metrics
gcloud run services describe codementor-ai-engine --region=us-central1

# List revisions
gcloud run revisions list --service=codementor-frontend --region=us-central1
```

### Update Deployment

To deploy new changes:

```bash
# Rebuild and push updated images
./scripts/deploy-gcp.sh

# Or update specific service
gcloud builds submit --tag=us-central1-docker.pkg.dev/PROJECT/app/frontend:latest ./frontend
gcloud run services update codementor-frontend \
  --image=us-central1-docker.pkg.dev/PROJECT/app/frontend:latest \
  --region=us-central1
```

### Cost Optimization

The infrastructure follows Gemini 3 Pro best practices for cost optimization:

- **Auto-scaling**: Services scale to 0 when idle
- **Resource Limits**: Right-sized CPU and memory
- **Concurrency**: Optimized request concurrency (80 requests/instance)
- **Startup Boost**: Enabled for AI Engine to reduce cold start costs
- **Regional Deployment**: Single region to minimize data transfer costs

Monitor costs:

```bash
# View billing
gcloud billing accounts list

# View project costs
gcloud billing projects describe PROJECT_ID
```

## Troubleshooting

### Common Issues

#### 1. Build Failures

```bash
# Check Cloud Build logs
gcloud builds list --limit=5
gcloud builds log BUILD_ID
```

#### 2. Service Not Starting

```bash
# Check service logs
gcloud run services logs read SERVICE_NAME --region=us-central1

# Check service configuration
gcloud run services describe SERVICE_NAME --region=us-central1
```

#### 3. Permission Errors

```bash
# Verify service account permissions
gcloud projects get-iam-policy PROJECT_ID

# Add missing roles
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member=serviceAccount:SERVICE_ACCOUNT \
  --role=ROLE_NAME
```

#### 4. "Failed to analyze code: 500" Error

**This is the most common issue for new deployments.**

**Symptoms:**
- Users see "Failed to analyze code: 500" when trying to run code analysis
- Error message says "Cannot connect to backend service"
- Health check shows `backend_url: "http://localhost:3001"` with `is_configured: false`

**Root Cause:**
The frontend is not configured with the backend's Cloud Run URL and is trying to connect to `localhost`, which doesn't work in Cloud Run.

**Solution:**

1. **Get your backend URL:**
   ```bash
   gcloud run services describe codementor-backend \
     --region=us-central1 \
     --format='value(status.url)'
   ```
   
   Example output: `https://codementor-backend-31499486874.us-central1.run.app`

2. **Configure the frontend with the backend URL:**
   
   The frontend needs `NEXT_PUBLIC_API_URL` environment variable set **at build time**.
   
   ```bash
   # Rebuild frontend with backend URL
   cd frontend
   docker build \
     --build-arg NEXT_PUBLIC_API_URL=https://codementor-backend-31499486874.us-central1.run.app \
     -t us-central1-docker.pkg.dev/PROJECT_ID/app/frontend:latest \
     .
   
   # Push the new image
   docker push us-central1-docker.pkg.dev/PROJECT_ID/app/frontend:latest
   
   # Deploy the frontend
   gcloud run deploy codementor-frontend \
     --image=us-central1-docker.pkg.dev/PROJECT_ID/app/frontend:latest \
     --region=us-central1 \
     --set-env-vars="NEXT_PUBLIC_API_URL=https://codementor-backend-31499486874.us-central1.run.app"
   ```

3. **Verify the fix:**
   ```bash
   # Check frontend health endpoint
   curl https://YOUR-FRONTEND-URL.run.app/api/health
   ```
   
   You should see:
   ```json
   {
     "status": "healthy",
     "backend_url": "https://codementor-backend-xxx.run.app",
     "is_configured": true,
     "checks": {
       "backend_reachable": true
     }
   }
   ```

**Why this happens:**
- Next.js `NEXT_PUBLIC_*` variables are embedded at **build time**, not runtime
- Setting the environment variable without rebuilding won't work
- You must rebuild the Docker image with the correct backend URL

**Prevention:**
Use the automated deployment script `./scripts/deploy-gcp.sh` which handles this automatically, or update your Terraform configuration to pass the backend URL during frontend build.

**For detailed configuration instructions, see:**
- `frontend/BACKEND_CONFIG.md` - Complete backend configuration guide
- Environment variable reference in `frontend/.env.example`

#### 5. Terraform State Issues

```bash
# Refresh Terraform state
cd infrastructure/terraform
terraform refresh

# If state is corrupted, you may need to import resources
terraform import google_cloud_run_v2_service.frontend projects/PROJECT/locations/REGION/services/SERVICE
```

### Health Checks

Verify all services are healthy:

```bash
#!/bin/bash
SERVICES=("frontend" "backend" "ai-engine")
for service in "${SERVICES[@]}"; do
  URL=$(gcloud run services describe codementor-$service --region=us-central1 --format='value(status.url)')
  echo "Checking $service at $URL/health"
  curl -f "$URL/health" || echo "❌ $service is unhealthy"
done
```

### Getting Help

- **GCP Documentation**: https://cloud.google.com/run/docs
- **Terraform GCP Provider**: https://registry.terraform.io/providers/hashicorp/google/latest/docs
- **Project Issues**: https://github.com/NAScherba71/codementor-ai-platform/issues

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Google Cloud Platform                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐ │
│  │   Frontend   │─────▶│   Backend    │─────▶│  AI Engine   │ │
│  │  (Next.js)   │      │  (Node.js)   │      │   (Flask)    │ │
│  │              │      │              │      │              │ │
│  │ Cloud Run    │      │ Cloud Run    │      │ Cloud Run    │ │
│  │ 0-10 inst.   │      │ 0-10 inst.   │      │ 0-10 inst.   │ │
│  └──────────────┘      └──────────────┘      └──────────────┘ │
│         │                      │                      │         │
│         └──────────────────────┴──────────────────────┘         │
│                                │                                │
│                    ┌───────────▼───────────┐                   │
│                    │  Artifact Registry    │                   │
│                    │  (Docker Images)      │                   │
│                    └───────────────────────┘                   │
│                                │                                │
│         ┌──────────────────────┼──────────────────────┐        │
│         │                      │                      │        │
│  ┌──────▼──────┐      ┌────────▼────────┐   ┌────────▼─────┐ │
│  │Secret Mgr   │      │  Vertex AI      │   │  Monitoring  │ │
│  │(Credentials)│      │  (AI Models)    │   │  & Logging   │ │
│  └─────────────┘      └─────────────────┘   └──────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Model-Specific Endpoints

The platform uses different AI models for different tasks:

- **Claude Sonnet 4.5**: `/ai/mentorship/welcome` - Warm, empathetic onboarding
- **GPT-5.2-Codex**: `/ai/roast` - Brutal code review and architectural feedback
- **Gemini 3 Flash**: `/ai/quick-challenge` - Sub-second coding challenges

Configure model endpoints in the AI Engine environment variables.

## Security Considerations

1. **Service Accounts**: Use least-privilege principle
2. **Secrets**: Store sensitive data in Secret Manager
3. **Network**: AI Engine is not publicly accessible (backend only)
4. **HTTPS**: All Cloud Run services use HTTPS by default
5. **IAM**: Regular audit of permissions

## Next Steps

After successful deployment:

1. ✅ Set up monitoring alerts
2. ✅ Configure backup and disaster recovery
3. ✅ Implement CI/CD pipeline with Cloud Build triggers
4. ✅ Set up staging environment
5. ✅ Configure custom domain and SSL
6. ✅ Enable Cloud CDN for static assets
7. ✅ Set up log retention policies

---

**Questions or Issues?** Please open an issue on GitHub or contact the development team.
