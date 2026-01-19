# 🔐 Environment Variables Configuration Guide

> **Complete guide for configuring environment variables across all services**

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Frontend Environment Variables](#frontend-environment-variables)
3. [Backend Environment Variables](#backend-environment-variables)
4. [AI Engine Environment Variables](#ai-engine-environment-variables)
5. [Setting Variables in GCP](#setting-variables-in-gcp)
6. [Using Secret Manager](#using-secret-manager)
7. [Retrieving from Terraform Outputs](#retrieving-from-terraform-outputs)
8. [Verification](#verification)
9. [Common Issues](#common-issues)

---

## Overview

The CodeMentor AI Platform uses environment variables for configuration across three services:
- **Frontend** (Next.js)
- **Backend** (Node.js/Express)
- **AI Engine** (Python/Flask)

Variables can be set as:
- **Environment Variables:** For non-sensitive configuration
- **Secrets:** For sensitive data (API keys, credentials)

---

## Frontend Environment Variables

### Required Variables

| Variable | Description | Example | Source |
|----------|-------------|---------|--------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `https://codementor-backend-xxx.run.app` | Terraform output: `backend_url` |
| `NEXT_PUBLIC_APP_ENV` | Application environment | `production` | Manual |
| `NEXT_PUBLIC_APP_NAME` | Application name | `CodeMentor AI` | Manual |

### Optional Variables

| Variable | Description | Example | Default |
|----------|-------------|---------|---------|
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | Enable analytics | `true` | `false` |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Support email | `support@codementor.ai` | - |

### Setting Frontend Variables

**Via gcloud CLI:**
```bash
# Get Backend URL from Terraform
cd infrastructure/terraform
export BACKEND_URL=$(terraform output -raw backend_url)

# Update Frontend service
gcloud run services update codementor-frontend \
  --region=us-central1 \
  --set-env-vars="NEXT_PUBLIC_API_URL=$BACKEND_URL,NEXT_PUBLIC_APP_ENV=production,NEXT_PUBLIC_APP_NAME=CodeMentor AI"
```

**Via Terraform:**
```hcl
# In infrastructure/terraform/main.tf
resource "google_cloud_run_v2_service" "frontend" {
  # ... other configuration ...
  
  template {
    containers {
      env {
        name  = "NEXT_PUBLIC_API_URL"
        value = google_cloud_run_v2_service.backend.uri
      }
      env {
        name  = "NEXT_PUBLIC_APP_ENV"
        value = var.environment
      }
      env {
        name  = "NEXT_PUBLIC_APP_NAME"
        value = "CodeMentor AI"
      }
    }
  }
}
```

---

## Backend Environment Variables

### Required Variables

| Variable | Description | Example | Source |
|----------|-------------|---------|--------|
| `AI_ENGINE_URL` | AI Engine service URL | `https://codementor-ai-engine-xxx.run.app` | Terraform output: `ai_engine_url` |
| `NODE_ENV` | Node environment | `production` | Manual |
| `PORT` | Server port | `8080` | Cloud Run default |

### Optional Variables

| Variable | Description | Example | Default |
|----------|-------------|---------|---------|
| `DATABASE_URL` | Database connection string | `postgresql://user:pass@host/db` | - |
| `REDIS_URL` | Redis connection string | `redis://host:6379` | - |
| `LOG_LEVEL` | Logging level | `info` | `info` |
| `API_RATE_LIMIT` | Rate limit per IP | `100` | `100` |
| `CORS_ORIGIN` | CORS allowed origins | `https://frontend.run.app` | `*` |
| `JWT_SECRET` | JWT signing secret | Stored in Secret Manager | - |
| `SESSION_SECRET` | Session secret | Stored in Secret Manager | - |

### Secrets (Sensitive Data)

| Secret Name | Description | How to Set |
|-------------|-------------|------------|
| `jwt-secret` | JWT signing secret | Secret Manager |
| `session-secret` | Session encryption key | Secret Manager |
| `database-url` | Database connection string | Secret Manager |

### Setting Backend Variables

**Environment Variables:**
```bash
# Get AI Engine URL from Terraform
cd infrastructure/terraform
export AI_ENGINE_URL=$(terraform output -raw ai_engine_url)
export FRONTEND_URL=$(terraform output -raw frontend_url)

# Update Backend service
gcloud run services update codementor-backend \
  --region=us-central1 \
  --set-env-vars="AI_ENGINE_URL=$AI_ENGINE_URL,NODE_ENV=production,PORT=8080,CORS_ORIGIN=$FRONTEND_URL,LOG_LEVEL=info"
```

**Secrets:**
```bash
# Create JWT secret
openssl rand -base64 32 | gcloud secrets create jwt-secret --data-file=-

# Create session secret
openssl rand -base64 32 | gcloud secrets create session-secret --data-file=-

# Get Backend service account
BACKEND_SA=$(gcloud run services describe codementor-backend \
  --region=us-central1 \
  --format='value(spec.template.spec.serviceAccountName)')

# Grant access to secrets
gcloud secrets add-iam-policy-binding jwt-secret \
  --member="serviceAccount:$BACKEND_SA" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding session-secret \
  --member="serviceAccount:$BACKEND_SA" \
  --role="roles/secretmanager.secretAccessor"

# Update Backend with secrets
gcloud run services update codementor-backend \
  --region=us-central1 \
  --update-secrets="JWT_SECRET=jwt-secret:latest,SESSION_SECRET=session-secret:latest"
```

---

## AI Engine Environment Variables

### Required Variables

| Variable | Description | Example | Default |
|----------|-------------|---------|---------|
| `FLASK_ENV` | Flask environment | `production` | `development` |
| `PORT` | Server port | `8080` | `5000` |

### Optional Variables

| Variable | Description | Example | Default |
|----------|-------------|---------|---------|
| `ENABLE_LOCAL_MODELS` | Enable Ollama models | `true` | `false` |
| `OLLAMA_BASE_URL` | Ollama API URL | `http://localhost:11434` | - |
| `ENABLE_GEMINI` | Enable Google Gemini | `true` | `false` |
| `ENABLE_OPENROUTER` | Enable OpenRouter | `true` | `false` |
| `MODEL_CACHE_DIR` | Model cache directory | `/app/models` | `/tmp/models` |
| `MAX_CONTEXT_LENGTH` | Max context tokens | `4096` | `2048` |
| `LOG_LEVEL` | Logging level | `INFO` | `INFO` |

### Secrets (Sensitive Data)

| Secret Name | Description | How to Set |
|-------------|-------------|------------|
| `gemini-api-key` | Google Gemini API key | Secret Manager |
| `openrouter-api-key` | OpenRouter API key | Secret Manager |
| `vertex-ai-credentials` | Vertex AI service account | Secret Manager |

### Setting AI Engine Variables

**Environment Variables:**
```bash
gcloud run services update codementor-ai-engine \
  --region=us-central1 \
  --set-env-vars="FLASK_ENV=production,PORT=8080,ENABLE_LOCAL_MODELS=true,LOG_LEVEL=INFO,MAX_CONTEXT_LENGTH=4096" \
  --memory=2Gi \
  --cpu=2
```

**Secrets for LLM Providers:**

**Google Gemini:**
```bash
# Store API key
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets create gemini-api-key --data-file=-

# Get AI Engine service account
AI_ENGINE_SA=$(gcloud run services describe codementor-ai-engine \
  --region=us-central1 \
  --format='value(spec.template.spec.serviceAccountName)')

# Grant access
gcloud secrets add-iam-policy-binding gemini-api-key \
  --member="serviceAccount:$AI_ENGINE_SA" \
  --role="roles/secretmanager.secretAccessor"

# Update service
gcloud run services update codementor-ai-engine \
  --region=us-central1 \
  --update-secrets="GEMINI_API_KEY=gemini-api-key:latest" \
  --update-env-vars="ENABLE_GEMINI=true"
```

**OpenRouter:**
```bash
# Store API key
echo -n "YOUR_OPENROUTER_API_KEY" | gcloud secrets create openrouter-api-key --data-file=-

# Grant access
gcloud secrets add-iam-policy-binding openrouter-api-key \
  --member="serviceAccount:$AI_ENGINE_SA" \
  --role="roles/secretmanager.secretAccessor"

# Update service
gcloud run services update codementor-ai-engine \
  --region=us-central1 \
  --update-secrets="OPENROUTER_API_KEY=openrouter-api-key:latest" \
  --update-env-vars="ENABLE_OPENROUTER=true"
```

---

## Setting Variables in GCP

### Method 1: gcloud CLI

**Set individual variables:**
```bash
gcloud run services update SERVICE_NAME \
  --region=REGION \
  --set-env-vars="KEY1=VALUE1,KEY2=VALUE2"
```

**Update variables (merge with existing):**
```bash
gcloud run services update SERVICE_NAME \
  --region=REGION \
  --update-env-vars="KEY=NEW_VALUE"
```

**Remove variables:**
```bash
gcloud run services update SERVICE_NAME \
  --region=REGION \
  --remove-env-vars="KEY1,KEY2"
```

### Method 2: Cloud Console

1. Go to [Cloud Run](https://console.cloud.google.com/run)
2. Click on your service
3. Click **Edit & Deploy New Revision**
4. Go to **Variables & Secrets** tab
5. Add/Edit environment variables
6. Click **Deploy**

### Method 3: Terraform

```hcl
resource "google_cloud_run_v2_service" "service_name" {
  # ... other configuration ...
  
  template {
    containers {
      # Regular environment variables
      env {
        name  = "VARIABLE_NAME"
        value = "value"
      }
      
      # From Secret Manager
      env {
        name = "SECRET_VAR"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.my_secret.secret_id
            version = "latest"
          }
        }
      }
    }
  }
}
```

---

## Using Secret Manager

### Creating Secrets

**From string:**
```bash
echo -n "secret-value" | gcloud secrets create SECRET_NAME --data-file=-
```

**From file:**
```bash
gcloud secrets create SECRET_NAME --data-file=/path/to/secret.txt
```

**Update secret:**
```bash
echo -n "new-value" | gcloud secrets versions add SECRET_NAME --data-file=-
```

### Granting Access to Secrets

```bash
# Get service account email
SA_EMAIL=$(gcloud run services describe SERVICE_NAME \
  --region=REGION \
  --format='value(spec.template.spec.serviceAccountName)')

# Grant access
gcloud secrets add-iam-policy-binding SECRET_NAME \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/secretmanager.secretAccessor"
```

### Mounting Secrets in Cloud Run

**As environment variable:**
```bash
gcloud run services update SERVICE_NAME \
  --region=REGION \
  --update-secrets="ENV_VAR_NAME=SECRET_NAME:latest"
```

**As volume mount:**
```bash
gcloud run services update SERVICE_NAME \
  --region=REGION \
  --update-secrets="/secrets/path=SECRET_NAME:latest"
```

---

## Retrieving from Terraform Outputs

### List All Outputs

```bash
cd infrastructure/terraform
terraform output
```

### Get Specific Output

```bash
# Get raw value (no quotes)
terraform output -raw OUTPUT_NAME

# Get JSON format
terraform output -json OUTPUT_NAME
```

### Common Outputs

```bash
# Service URLs
export FRONTEND_URL=$(terraform output -raw frontend_url)
export BACKEND_URL=$(terraform output -raw backend_url)
export AI_ENGINE_URL=$(terraform output -raw ai_engine_url)

# Service Account Emails
export DEPLOYER_SA=$(terraform output -raw deployer_service_account_email)
export CLOUDRUN_SA=$(terraform output -raw cloudrun_service_account_email)
export AI_ENGINE_SA=$(terraform output -raw ai_engine_service_account_email)

# Docker Image Paths
export FRONTEND_IMAGE=$(terraform output -raw docker_image_frontend)
export BACKEND_IMAGE=$(terraform output -raw docker_image_backend)
export AI_ENGINE_IMAGE=$(terraform output -raw docker_image_ai_engine)

# Project Info
export PROJECT_ID=$(terraform output -raw project_id)
export REGION=$(terraform output -raw region)
```

### Save All Outputs to File

```bash
# JSON format
terraform output -json > terraform-outputs.json

# Use jq to parse
cat terraform-outputs.json | jq -r '.frontend_url.value'
```

---

## Verification

### Check Environment Variables

**List all variables for a service:**
```bash
gcloud run services describe SERVICE_NAME \
  --region=REGION \
  --format="yaml(spec.template.spec.containers[0].env)"
```

**Check specific variable:**
```bash
gcloud run services describe SERVICE_NAME \
  --region=REGION \
  --format="value(spec.template.spec.containers[0].env)" | grep VARIABLE_NAME
```

### Verify Secrets Access

**List secrets in project:**
```bash
gcloud secrets list
```

**Check who has access:**
```bash
gcloud secrets get-iam-policy SECRET_NAME
```

**Test secret access from service:**
```bash
# View service logs and check for secret access errors
gcloud run services logs read SERVICE_NAME --limit=50 | grep -i secret
```

### Test Configuration

**Frontend connectivity to Backend:**
```bash
# From frontend service, test Backend URL
curl -I $BACKEND_URL/api/health
```

**Backend connectivity to AI Engine:**
```bash
# Test from Backend
curl -X POST $BACKEND_URL/api/test-ai-engine
```

**Complete verification script:**
```bash
bash deploy/scripts/health-checks.sh
```

---

## Common Issues

### Issue 1: Variables Not Taking Effect

**Symptoms:**
- Application uses default/old values
- Environment variables appear undefined in logs

**Solutions:**
1. Redeploy the service:
```bash
gcloud run services update SERVICE_NAME \
  --region=REGION \
  --update-env-vars="KEY=VALUE"
```

2. Check variable name (case-sensitive):
```bash
# List all variables
gcloud run services describe SERVICE_NAME \
  --format="value(spec.template.spec.containers[0].env)"
```

3. Wait for deployment to complete:
```bash
gcloud run services describe SERVICE_NAME \
  --format="value(status.conditions)"
```

### Issue 2: Secret Access Denied

**Symptoms:**
- "Permission denied" errors
- "Secret not found" errors

**Solutions:**
1. Verify secret exists:
```bash
gcloud secrets describe SECRET_NAME
```

2. Check IAM permissions:
```bash
gcloud secrets get-iam-policy SECRET_NAME
```

3. Grant access:
```bash
gcloud secrets add-iam-policy-binding SECRET_NAME \
  --member="serviceAccount:SA_EMAIL" \
  --role="roles/secretmanager.secretAccessor"
```

### Issue 3: Service URLs Incorrect

**Symptoms:**
- 404 errors when services communicate
- CORS errors in browser

**Solutions:**
1. Get current URLs:
```bash
cd infrastructure/terraform
terraform output
```

2. Update all services:
```bash
# Update Backend with AI Engine URL
gcloud run services update codementor-backend \
  --update-env-vars="AI_ENGINE_URL=$(terraform output -raw ai_engine_url)"

# Update Frontend with Backend URL
gcloud run services update codementor-frontend \
  --update-env-vars="NEXT_PUBLIC_API_URL=$(terraform output -raw backend_url)"
```

### Issue 4: Secrets Not Updating

**Symptoms:**
- Service still uses old secret value
- Recent secret changes not reflected

**Solutions:**
1. Create new secret version:
```bash
echo -n "new-value" | gcloud secrets versions add SECRET_NAME --data-file=-
```

2. Update service to use latest version:
```bash
gcloud run services update SERVICE_NAME \
  --update-secrets="ENV_VAR=SECRET_NAME:latest"
```

3. Force new deployment:
```bash
gcloud run services update SERVICE_NAME \
  --region=REGION \
  --no-traffic  # Deploy without traffic
# Then route traffic to new revision
```

---

## Environment Variables Checklist

### Frontend ✅
- [ ] `NEXT_PUBLIC_API_URL` set to Backend URL
- [ ] `NEXT_PUBLIC_APP_ENV` set to production
- [ ] Service can reach Backend API

### Backend ✅
- [ ] `AI_ENGINE_URL` set to AI Engine URL
- [ ] `NODE_ENV` set to production
- [ ] `PORT` set to 8080
- [ ] `CORS_ORIGIN` set to Frontend URL
- [ ] All secrets accessible (JWT_SECRET, SESSION_SECRET)
- [ ] Database connection works (if applicable)
- [ ] Service can reach AI Engine

### AI Engine ✅
- [ ] `FLASK_ENV` set to production
- [ ] `PORT` set to 8080
- [ ] LLM provider variables set correctly
- [ ] API keys accessible from Secret Manager
- [ ] Memory and CPU limits appropriate (2Gi, 2 CPU)

---

## Quick Reference Commands

```bash
# Set environment variable
gcloud run services update SERVICE --update-env-vars="KEY=VALUE"

# Set secret
gcloud run services update SERVICE --update-secrets="KEY=SECRET:latest"

# Remove variable
gcloud run services update SERVICE --remove-env-vars="KEY"

# List variables
gcloud run services describe SERVICE --format="yaml(spec.template.spec.containers[0].env)"

# Create secret
echo -n "value" | gcloud secrets create SECRET_NAME --data-file=-

# Grant secret access
gcloud secrets add-iam-policy-binding SECRET_NAME \
  --member="serviceAccount:SA_EMAIL" \
  --role="roles/secretmanager.secretAccessor"

# Get Terraform output
cd infrastructure/terraform && terraform output -raw OUTPUT_NAME
```

---

**Need help?** Check the [Troubleshooting Guide](./TROUBLESHOOTING_GUIDE.md) or [main deployment guide](./GCP_STEP_BY_STEP_DEPLOYMENT.md).
