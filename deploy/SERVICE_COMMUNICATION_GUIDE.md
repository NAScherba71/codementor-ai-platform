# 🔗 CodeMentor AI Platform - Service Communication Guide

> **Complete guide for understanding and debugging inter-service communication in GCP**

**Purpose:** Master how Frontend, Backend, and AI Engine communicate securely on Google Cloud Run  
**Audience:** DevOps engineers, developers troubleshooting connectivity issues

---

## 📋 Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Frontend → Backend Communication](#2-frontend--backend-communication)
3. [Backend → AI Engine Communication](#3-backend--ai-engine-communication)
4. [Service Authentication & Authorization](#4-service-authentication--authorization)
5. [Network Policies & Firewall Rules](#5-network-policies--firewall-rules)
6. [Service Discovery & Environment Variables](#6-service-discovery--environment-variables)
7. [Testing Communication Paths](#7-testing-communication-paths)
8. [Debugging Connection Issues](#8-debugging-connection-issues)
9. [Security Best Practices](#9-security-best-practices)
10. [Quick Reference](#10-quick-reference)

---

## 1. Architecture Overview

### 1.1 Service Communication Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         INTERNET / USERS                             │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 │ HTTPS (Public)
                                 │
                    ┌────────────▼────────────┐
                    │  FRONTEND (Next.js)     │
                    │  Cloud Run Service      │
                    │  Port: 3000             │
                    │  Allow: unauthenticated │
                    └────────────┬────────────┘
                                 │
                                 │ HTTPS/REST API (Public)
                                 │ + CORS headers
                                 │
                    ┌────────────▼────────────┐
                    │  BACKEND (Node.js)      │
                    │  Cloud Run Service      │
                    │  Port: 8080             │
                    │  Allow: unauthenticated │
                    └────────────┬────────────┘
                                 │
                                 │ HTTPS (Service-to-Service)
                                 │ + Google Cloud IAM Auth
                                 │ + Service Account Token
                                 │
                    ┌────────────▼────────────┐
                    │  AI ENGINE (Python)     │
                    │  Cloud Run Service      │
                    │  Port: 5000             │
                    │  IAM: Backend SA only   │
                    └─────────────────────────┘
                                 │
                                 │ API Calls (Authenticated)
                                 │
                    ┌────────────▼────────────┐
                    │  VERTEX AI / GCP APIs   │
                    │  Gemini, PaLM, etc.     │
                    └─────────────────────────┘
```

### 1.2 Service Details

| Service | Technology | Port | Public Access | Authentication |
|---------|-----------|------|---------------|----------------|
| **Frontend** | Next.js 14 | 3000 | ✅ Yes | None (public web app) |
| **Backend** | Node.js/Express | 8080 | ✅ Yes | None (API endpoint) |
| **AI Engine** | Python/Flask | 5000 | ❌ No | IAM Service Account |

### 1.3 Communication Protocols

- **Frontend → Backend**: HTTP/REST API over HTTPS (TLS 1.2+)
- **Backend → AI Engine**: HTTP/REST with Google Cloud Identity Tokens
- **Backend/AI → GCP Services**: gRPC/REST with Application Default Credentials

---

## 2. Frontend → Backend Communication

### 2.1 How It Works

The Frontend is a Next.js application that makes HTTP requests to the Backend API.

**Key Configuration Files:**

```typescript
// frontend/src/services/onboarding.service.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Example API call
async function createSession(data) {
  const response = await fetch(`${API_BASE_URL}/api/onboarding/session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  })
  return response.json()
}
```

### 2.2 CORS Configuration

The Backend must allow requests from the Frontend domain.

```javascript
// backend/server.js
const cors = require('cors');

const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://codementor-frontend-*.run.app',
    process.env.FRONTEND_URL
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
```

### 2.3 Environment Variables Setup

**On Cloud Run:**

```bash
# Get Backend URL
export BACKEND_URL=$(gcloud run services describe codementor-backend \
  --platform=managed \
  --region=us-central1 \
  --format='value(status.url)')

# Update Frontend with Backend URL
gcloud run services update codementor-frontend \
  --region=us-central1 \
  --update-env-vars="NEXT_PUBLIC_API_URL=$BACKEND_URL"

# Verify environment variable
gcloud run services describe codementor-frontend \
  --region=us-central1 \
  --format='value(spec.template.spec.containers[0].env)'
```

### 2.4 Testing Frontend → Backend

**Test 1: Health Check**

```bash
# Get Frontend URL
export FRONTEND_URL=$(gcloud run services describe codementor-frontend \
  --region=us-central1 \
  --format='value(status.url)')

# Visit in browser
echo "Open: $FRONTEND_URL"

# Check if Frontend can reach Backend (from browser console)
fetch('/api/health')
  .then(r => r.json())
  .then(console.log)
```

**Test 2: Direct API Call**

```bash
# Call Backend API directly
curl -X GET "$BACKEND_URL/api/health" \
  -H "Content-Type: application/json"

# Expected response:
# {"status":"ok","timestamp":"2024-01-15T12:00:00Z"}
```

**Test 3: CORS Headers**

```bash
# Test CORS preflight
curl -X OPTIONS "$BACKEND_URL/api/onboarding/session" \
  -H "Origin: $FRONTEND_URL" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v

# Look for these headers in response:
# Access-Control-Allow-Origin: <frontend-url>
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
# Access-Control-Allow-Headers: Content-Type, Authorization
```

### 2.5 Common Frontend → Backend Issues

| Issue | Symptom | Solution |
|-------|---------|----------|
| CORS Error | `Access-Control-Allow-Origin` error in browser | Update CORS config in backend, redeploy |
| Wrong URL | `Failed to fetch` or 404 errors | Verify `NEXT_PUBLIC_API_URL` is set correctly |
| SSL/TLS Error | `net::ERR_CERT_AUTHORITY_INVALID` | Ensure using HTTPS URLs for production |
| Network timeout | Request hangs indefinitely | Check Backend is running and accessible |

---

## 3. Backend → AI Engine Communication

### 3.1 How It Works

The Backend calls the AI Engine using authenticated HTTP requests with Google Cloud identity tokens.

**Key Configuration:**

```javascript
// backend/routes/assessment.js
const axios = require('axios');
const { GoogleAuth } = require('google-auth-library');

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:5000';

// Create auth client for service-to-service calls
const auth = new GoogleAuth();

async function callAIEngine(endpoint, data) {
  // Get ID token for the AI Engine service
  const client = await auth.getIdTokenClient(AI_ENGINE_URL);
  
  // Make authenticated request
  const response = await client.request({
    url: `${AI_ENGINE_URL}${endpoint}`,
    method: 'POST',
    data: data
  });
  
  return response.data;
}

// Usage example
router.post('/code-test/start', async (req, res) => {
  try {
    const result = await callAIEngine('/assess/code-test/start', {
      user_id: req.body.userId,
      level: req.body.level || 'junior'
    });
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('AI Engine error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});
```

### 3.2 Service Account Configuration

**Backend Service Account** needs `roles/run.invoker` permission on AI Engine.

```bash
# Get Backend's service account
export BACKEND_SA=$(gcloud run services describe codementor-backend \
  --region=us-central1 \
  --format='value(spec.template.spec.serviceAccountName)')

echo "Backend Service Account: $BACKEND_SA"

# Grant invoker permission on AI Engine
gcloud run services add-iam-policy-binding codementor-ai-engine \
  --region=us-central1 \
  --member="serviceAccount:$BACKEND_SA" \
  --role="roles/run.invoker"

# Verify the binding
gcloud run services get-iam-policy codementor-ai-engine \
  --region=us-central1 \
  --format=json
```

**Expected IAM Policy:**

```json
{
  "bindings": [
    {
      "members": [
        "serviceAccount:codementor-cloud-run@PROJECT_ID.iam.gserviceaccount.com"
      ],
      "role": "roles/run.invoker"
    }
  ]
}
```

### 3.3 Identity Token Flow

```
┌─────────────┐                    ┌─────────────┐
│   Backend   │                    │  AI Engine  │
│  Cloud Run  │                    │  Cloud Run  │
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       │ 1. Request ID token from        │
       │    Google Metadata Service       │
       ├─────────────────────────────────►│
       │                                  │
       │ 2. Return ID token (JWT)         │
       │◄─────────────────────────────────┤
       │                                  │
       │ 3. Call AI Engine with token     │
       │    Authorization: Bearer <token> │
       ├─────────────────────────────────►│
       │                                  │
       │                           4. Verify token
       │                              with Google
       │                                  │
       │ 5. Return response               │
       │◄─────────────────────────────────┤
       │                                  │
```

### 3.4 Testing Backend → AI Engine

**Test 1: Manual Token Generation**

```bash
# Get AI Engine URL
export AI_ENGINE_URL=$(gcloud run services describe codementor-ai-engine \
  --region=us-central1 \
  --format='value(status.url)')

# Generate an identity token (using your own credentials - for testing only)
export TOKEN=$(gcloud auth print-identity-token \
  --audiences="$AI_ENGINE_URL")

# Test authenticated call to AI Engine
curl -X GET "$AI_ENGINE_URL/health" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Expected: {"status":"healthy","service":"ai-engine"}
```

**Test 2: Test from Backend Service**

```bash
# Check Backend logs to see the communication
gcloud logging read "resource.type=cloud_run_revision \
  AND resource.labels.service_name=codementor-backend \
  AND textPayload:\"AI_ENGINE\"" \
  --limit=50 \
  --format=json
```

**Test 3: Verify IAM Permissions**

```bash
# Test IAM policy check
gcloud run services get-iam-policy codementor-ai-engine \
  --region=us-central1

# Should show Backend SA with run.invoker role
```

### 3.5 Common Backend → AI Engine Issues

| Issue | Symptom | Solution |
|-------|---------|----------|
| 403 Forbidden | "Permission denied" or "Caller does not have permission" | Grant `roles/run.invoker` to Backend SA |
| 401 Unauthorized | "Invalid authentication credentials" | Check token generation logic |
| Connection timeout | Request hangs, no response | Verify AI Engine is deployed and running |
| Wrong URL | 404 Not Found | Check `AI_ENGINE_URL` environment variable |
| Token expired | Intermittent 401 errors | Implement token refresh logic |


---

## 4. Service Authentication & Authorization

### 4.1 Service Accounts Overview

Three service accounts are used in the platform:

```bash
# List all service accounts
gcloud iam service-accounts list --filter="codementor"

# Expected output:
# NAME                                    EMAIL
# codementor-deployer                     codementor-deployer@PROJECT_ID.iam.gserviceaccount.com
# codementor-cloud-run                    codementor-cloud-run@PROJECT_ID.iam.gserviceaccount.com
# codementor-ai-engine                    codementor-ai-engine@PROJECT_ID.iam.gserviceaccount.com
```

### 4.2 Service Account Roles

**1. Deployer Service Account** (for CI/CD)

```bash
# View roles
gcloud projects get-iam-policy PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:codementor-deployer@*" \
  --format="table(bindings.role)"

# Roles:
# - roles/run.admin          (Deploy Cloud Run services)
# - roles/storage.admin      (Push Docker images)
# - roles/iam.serviceAccountUser (Use service accounts)
# - roles/artifactregistry.writer (Push to Artifact Registry)
```

**2. Backend/Frontend Service Account** (Runtime)

```bash
# View roles
gcloud projects get-iam-policy PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:codementor-cloud-run@*" \
  --format="table(bindings.role)"

# Roles:
# - roles/run.invoker        (Call AI Engine)
# - roles/cloudsql.client    (Connect to database)
# - roles/storage.objectViewer (Read from GCS)
# - roles/logging.logWriter  (Write logs)
```

**3. AI Engine Service Account** (Runtime with AI access)

```bash
# View roles
gcloud projects get-iam-policy PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:codementor-ai-engine@*" \
  --format="table(bindings.role)"

# Roles:
# - roles/aiplatform.user    (Use Vertex AI)
# - roles/ml.developer       (ML operations)
# - roles/storage.objectViewer (Read models)
# - roles/logging.logWriter  (Write logs)
```

### 4.3 IAM Permissions Matrix

| Service | Can Access | Permission Required | How It's Granted |
|---------|-----------|-------------------|------------------|
| Frontend | Backend API | None (public) | `allUsers` has `run.invoker` |
| Backend | AI Engine | `run.invoker` | IAM binding on AI Engine |
| AI Engine | Vertex AI | `aiplatform.user` | Service Account roles |
| All Services | Cloud Logging | `logging.logWriter` | Service Account roles |
| All Services | Cloud Trace | `cloudtrace.agent` | Service Account roles |

### 4.4 Managing Service Account Keys (Local Development)

```bash
# Create a key for local development (NOT for production)
gcloud iam service-accounts keys create ~/codementor-local-key.json \
  --iam-account=codementor-cloud-run@PROJECT_ID.iam.gserviceaccount.com

# Set environment variable
export GOOGLE_APPLICATION_CREDENTIALS=~/codementor-local-key.json

# Verify it works
gcloud auth application-default print-access-token

# IMPORTANT: Delete after testing
gcloud iam service-accounts keys delete KEY_ID \
  --iam-account=codementor-cloud-run@PROJECT_ID.iam.gserviceaccount.com

# List keys to verify deletion
gcloud iam service-accounts keys list \
  --iam-account=codementor-cloud-run@PROJECT_ID.iam.gserviceaccount.com
```

⚠️ **Security Warning:** Never commit service account keys to Git!

---

## 5. Network Policies & Firewall Rules

### 5.1 Cloud Run Network Model

Cloud Run uses **Google's global load balancer** with automatic TLS termination.

**Default Network Behavior:**

- All Cloud Run services get a public HTTPS endpoint
- Ingress can be controlled via IAM policies
- All traffic is encrypted with TLS 1.2+
- Automatic DDoS protection
- No VPC networking required for service-to-service calls

### 5.2 Ingress Settings

Configure who can call your services:

```bash
# Option 1: Public access (Frontend, Backend)
gcloud run services update codementor-backend \
  --region=us-central1 \
  --ingress=all

# Option 2: Internal and Cloud Load Balancing only
gcloud run services update codementor-ai-engine \
  --region=us-central1 \
  --ingress=internal-and-cloud-load-balancing

# Option 3: Internal only (VPC-only traffic)
gcloud run services update codementor-ai-engine \
  --region=us-central1 \
  --ingress=internal

# View current ingress settings
gcloud run services describe codementor-ai-engine \
  --region=us-central1 \
  --format='value(spec.template.metadata.annotations."run.googleapis.com/ingress")'
```

**Recommendation for This Platform:**

- **Frontend**: `all` (public web app)
- **Backend**: `all` (public API)
- **AI Engine**: `internal-and-cloud-load-balancing` (only Backend can call)

### 5.3 VPC Connector (Optional)

For advanced networking (database, Redis, etc.):

```bash
# Create VPC network
gcloud compute networks create codementor-vpc \
  --subnet-mode=custom

# Create subnet
gcloud compute networks subnets create codementor-subnet \
  --network=codementor-vpc \
  --region=us-central1 \
  --range=10.0.0.0/24

# Create Serverless VPC Access connector
gcloud compute networks vpc-access connectors create codementor-connector \
  --region=us-central1 \
  --network=codementor-vpc \
  --range=10.8.0.0/28 \
  --min-instances=2 \
  --max-instances=10

# Attach to Cloud Run service
gcloud run services update codementor-backend \
  --region=us-central1 \
  --vpc-connector=codementor-connector \
  --vpc-egress=private-ranges-only

# Verify connection
gcloud run services describe codementor-backend \
  --region=us-central1 \
  --format='value(spec.template.metadata.annotations."run.googleapis.com/vpc-access-connector")'
```

### 5.4 Firewall Rules (If Using VPC)

```bash
# Allow ingress from Cloud Run to Cloud SQL
gcloud compute firewall-rules create allow-cloud-run-to-sql \
  --network=codementor-vpc \
  --allow=tcp:5432 \
  --source-ranges=10.8.0.0/28 \
  --target-tags=cloudsql

# Allow health checks
gcloud compute firewall-rules create allow-health-checks \
  --network=codementor-vpc \
  --allow=tcp:8080,tcp:5000 \
  --source-ranges=130.211.0.0/22,35.191.0.0/16

# List all firewall rules
gcloud compute firewall-rules list --filter="network:codementor-vpc"
```

### 5.5 Network Troubleshooting

```bash
# Get service URLs
export BACKEND_URL=$(gcloud run services describe codementor-backend \
  --region=us-central1 \
  --format='value(status.url)')

export AI_ENGINE_URL=$(gcloud run services describe codementor-ai-engine \
  --region=us-central1 \
  --format='value(status.url)')

# Test from outside (should fail if ingress=internal)
curl -X GET "$AI_ENGINE_URL/health"

# Test with proper authentication
curl -X GET "$AI_ENGINE_URL/health" \
  -H "Authorization: Bearer $(gcloud auth print-identity-token --audiences=$AI_ENGINE_URL)"
```


---

## 6. Service Discovery & Environment Variables

### 6.1 How Services Find Each Other

Services discover each other via **environment variables** set on Cloud Run.

**Environment Variable Pattern:**

```bash
# Frontend needs to know Backend URL
NEXT_PUBLIC_API_URL=https://codementor-backend-xxx.run.app

# Backend needs to know AI Engine URL
AI_ENGINE_URL=https://codementor-ai-engine-xxx.run.app
```

### 6.2 Setting Environment Variables

**Method 1: Via gcloud CLI**

```bash
# Get service URLs
export BACKEND_URL=$(gcloud run services describe codementor-backend \
  --region=us-central1 --format='value(status.url)')

export AI_ENGINE_URL=$(gcloud run services describe codementor-ai-engine \
  --region=us-central1 --format='value(status.url)')

# Set on Frontend
gcloud run services update codementor-frontend \
  --region=us-central1 \
  --update-env-vars="NEXT_PUBLIC_API_URL=$BACKEND_URL"

# Set on Backend
gcloud run services update codementor-backend \
  --region=us-central1 \
  --update-env-vars="AI_ENGINE_URL=$AI_ENGINE_URL,NODE_ENV=production"

# Set multiple variables at once
gcloud run services update codementor-ai-engine \
  --region=us-central1 \
  --set-env-vars="FLASK_ENV=production,LOG_LEVEL=info,VERTEX_AI_PROJECT=$PROJECT_ID"
```

**Method 2: Via Terraform**

```hcl
# infrastructure/terraform/main.tf

resource "google_cloud_run_v2_service" "backend" {
  name     = "codementor-backend"
  location = var.region

  template {
    containers {
      image = "us-central1-docker.pkg.dev/${var.project_id}/codementor-app/backend:latest"
      
      env {
        name  = "AI_ENGINE_URL"
        value = google_cloud_run_v2_service.ai_engine.uri
      }
      
      env {
        name  = "NODE_ENV"
        value = "production"
      }
    }
  }
}
```

**Method 3: Via Console**

1. Go to [Cloud Run Console](https://console.cloud.google.com/run)
2. Click on your service
3. Click "EDIT & DEPLOY NEW REVISION"
4. Scroll to "Container(s), Volumes, Networking, Security"
5. Click "VARIABLES & SECRETS" tab
6. Add/Edit environment variables
7. Click "DEPLOY"

### 6.3 Viewing Current Environment Variables

```bash
# View all environment variables for a service
gcloud run services describe codementor-backend \
  --region=us-central1 \
  --format='value(spec.template.spec.containers[0].env)'

# Pretty print as JSON
gcloud run services describe codementor-backend \
  --region=us-central1 \
  --format=json | jq '.spec.template.spec.containers[0].env'

# Check specific variable
gcloud run services describe codementor-backend \
  --region=us-central1 \
  --format=json | jq -r '.spec.template.spec.containers[0].env[] | select(.name=="AI_ENGINE_URL") | .value'
```

### 6.4 Environment Variables Best Practices

**Naming Convention:**

- `NEXT_PUBLIC_*` - Frontend env vars (exposed to browser)
- `*_URL` - Service endpoint URLs
- `*_API_KEY` - API keys (use Secret Manager instead!)
- `NODE_ENV` / `FLASK_ENV` - Environment mode
- `LOG_LEVEL` - Logging verbosity

**Security:**

- ❌ **DON'T** store secrets in environment variables
- ✅ **DO** use Google Secret Manager for sensitive data
- ✅ **DO** use Service Accounts for GCP authentication
- ✅ **DO** validate all environment variables on startup

**Using Secret Manager:**

```bash
# Create a secret
echo -n "my-secret-api-key" | gcloud secrets create openai-api-key \
  --data-file=-

# Grant access to service account
gcloud secrets add-iam-policy-binding openai-api-key \
  --member="serviceAccount:codementor-ai-engine@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Use in Cloud Run
gcloud run services update codementor-ai-engine \
  --region=us-central1 \
  --update-secrets="OPENAI_API_KEY=openai-api-key:latest"
```

---

## 7. Testing Communication Paths

### 7.1 End-to-End Communication Test

Save this script as `test-service-communication.sh`:

```bash
#!/bin/bash
# test-service-communication.sh

set -e

PROJECT_ID="your-project-id"
REGION="us-central1"

echo "🔍 Testing CodeMentor Service Communication..."

# Get service URLs
export FRONTEND_URL=$(gcloud run services describe codementor-frontend \
  --region=$REGION --format='value(status.url)')

export BACKEND_URL=$(gcloud run services describe codementor-backend \
  --region=$REGION --format='value(status.url)')

export AI_ENGINE_URL=$(gcloud run services describe codementor-ai-engine \
  --region=$REGION --format='value(status.url)')

echo "✅ Service URLs retrieved"
echo "   Frontend:  $FRONTEND_URL"
echo "   Backend:   $BACKEND_URL"
echo "   AI Engine: $AI_ENGINE_URL"
echo ""

# Test 1: Frontend accessibility
echo "🧪 Test 1: Frontend Accessibility"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
if [ "$STATUS" -eq 200 ] || [ "$STATUS" -eq 301 ] || [ "$STATUS" -eq 302 ]; then
  echo "   ✅ Frontend is accessible (HTTP $STATUS)"
else
  echo "   ❌ Frontend failed (HTTP $STATUS)"
  exit 1
fi
echo ""

# Test 2: Backend health check
echo "🧪 Test 2: Backend Health Check"
HEALTH=$(curl -s "$BACKEND_URL/api/health")
if echo "$HEALTH" | grep -q "ok\|healthy"; then
  echo "   ✅ Backend health check passed"
  echo "   Response: $HEALTH"
else
  echo "   ❌ Backend health check failed"
  echo "   Response: $HEALTH"
  exit 1
fi
echo ""

# Test 3: AI Engine health check (requires authentication)
echo "🧪 Test 3: AI Engine Health Check (Authenticated)"
TOKEN=$(gcloud auth print-identity-token --audiences="$AI_ENGINE_URL")
AI_HEALTH=$(curl -s -H "Authorization: Bearer $TOKEN" "$AI_ENGINE_URL/health")
if echo "$AI_HEALTH" | grep -q "healthy"; then
  echo "   ✅ AI Engine health check passed"
  echo "   Response: $AI_HEALTH"
else
  echo "   ❌ AI Engine health check failed"
  echo "   Response: $AI_HEALTH"
  exit 1
fi
echo ""

# Test 4: Backend → AI Engine communication
echo "🧪 Test 4: Backend → AI Engine Communication"
TEST_PAYLOAD='{"user_id":"test-user","level":"junior","topic":"arrays"}'
BACKEND_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/assessment/code-test/start" \
  -H "Content-Type: application/json" \
  -d "$TEST_PAYLOAD")

if echo "$BACKEND_RESPONSE" | grep -q "success"; then
  echo "   ✅ Backend successfully called AI Engine"
else
  echo "   ❌ Backend → AI Engine call failed"
  echo "   Response: $BACKEND_RESPONSE"
  exit 1
fi
echo ""

# Test 5: CORS headers
echo "🧪 Test 5: CORS Configuration"
CORS_HEADERS=$(curl -s -X OPTIONS "$BACKEND_URL/api/health" \
  -H "Origin: $FRONTEND_URL" \
  -H "Access-Control-Request-Method: POST" \
  -I | grep -i "access-control")

if echo "$CORS_HEADERS" | grep -q "Access-Control-Allow-Origin"; then
  echo "   ✅ CORS headers configured correctly"
else
  echo "   ❌ CORS headers missing"
  exit 1
fi
echo ""

echo "🎉 All communication tests passed!"
```

### 7.2 Testing Individual Endpoints

**Frontend Health:**

```bash
curl -I https://codementor-frontend-xxx.run.app
```

**Backend API Endpoints:**

```bash
# Health check
curl https://codementor-backend-xxx.run.app/api/health

# Onboarding session (POST)
curl -X POST https://codementor-backend-xxx.run.app/api/onboarding/session \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-123","role":"frontend","experience":"2-5"}'

# Assessment start (POST)
curl -X POST https://codementor-backend-xxx.run.app/api/assessment/code-test/start \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-123","level":"junior","topic":"arrays"}'
```

**AI Engine Endpoints (with auth):**

```bash
# Get identity token
export TOKEN=$(gcloud auth print-identity-token \
  --audiences="https://codementor-ai-engine-xxx.run.app")

# Health check
curl https://codementor-ai-engine-xxx.run.app/health \
  -H "Authorization: Bearer $TOKEN"

# Code assessment
curl -X POST https://codementor-ai-engine-xxx.run.app/assess/code-test/start \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test-123","level":"junior","topic":"arrays"}'
```

### 7.3 Load Testing

```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Test Backend (100 requests, 10 concurrent)
ab -n 100 -c 10 https://codementor-backend-xxx.run.app/api/health

# Test with POST data
ab -n 100 -c 10 -p test-payload.json -T application/json \
  https://codementor-backend-xxx.run.app/api/assessment/code-test/start

# Using wrk for more advanced testing
wrk -t4 -c100 -d30s https://codementor-backend-xxx.run.app/api/health
```


---

## 8. Debugging Connection Issues

### 8.1 Common Error Messages

**Error: "Permission denied / 403 Forbidden"**

```
Error: The caller does not have permission
```

**Diagnosis:**

```bash
# Check IAM policy on AI Engine
gcloud run services get-iam-policy codementor-ai-engine \
  --region=us-central1

# Verify Backend SA has run.invoker role
gcloud run services get-iam-policy codementor-ai-engine \
  --region=us-central1 \
  --format=json | jq '.bindings[] | select(.role=="roles/run.invoker")'
```

**Fix:**

```bash
# Add the missing permission
export BACKEND_SA=$(gcloud run services describe codementor-backend \
  --region=us-central1 \
  --format='value(spec.template.spec.serviceAccountName)')

gcloud run services add-iam-policy-binding codementor-ai-engine \
  --region=us-central1 \
  --member="serviceAccount:$BACKEND_SA" \
  --role="roles/run.invoker"
```

---

**Error: "Failed to fetch / CORS error"**

```
Access to fetch at 'https://backend.run.app/api/...' from origin 'https://frontend.run.app' 
has been blocked by CORS policy
```

**Diagnosis:**

```bash
# Check CORS preflight
curl -X OPTIONS "https://codementor-backend-xxx.run.app/api/health" \
  -H "Origin: https://codementor-frontend-xxx.run.app" \
  -H "Access-Control-Request-Method: POST" \
  -v 2>&1 | grep -i access-control
```

**Fix:**

```javascript
// backend/server.js - Add Frontend URL to CORS whitelist
const corsOptions = {
  origin: [
    'https://codementor-frontend-xxx.run.app', // Add actual URL
    process.env.FRONTEND_URL
  ],
  credentials: true
};
app.use(cors(corsOptions));
```

Redeploy Backend after fixing.

---

**Error: "net::ERR_NAME_NOT_RESOLVED"**

```
Failed to fetch: net::ERR_NAME_NOT_RESOLVED
```

**Diagnosis:**

```bash
# Check if environment variable is set correctly
gcloud run services describe codementor-frontend \
  --region=us-central1 \
  --format=json | jq -r '.spec.template.spec.containers[0].env[] | select(.name=="NEXT_PUBLIC_API_URL")'

# Should return: {"name":"NEXT_PUBLIC_API_URL","value":"https://..."}
```

**Fix:**

```bash
# Set the correct URL
export BACKEND_URL=$(gcloud run services describe codementor-backend \
  --region=us-central1 \
  --format='value(status.url)')

gcloud run services update codementor-frontend \
  --region=us-central1 \
  --update-env-vars="NEXT_PUBLIC_API_URL=$BACKEND_URL"
```

---

**Error: "Connection timeout / Request failed with status code 504"**

```
Error: timeout of 10000ms exceeded
```

**Diagnosis:**

```bash
# Check if service is running
gcloud run services describe codementor-ai-engine \
  --region=us-central1 \
  --format='value(status.conditions[0].type,status.conditions[0].status)'

# Check recent logs for crashes
gcloud logging read "resource.type=cloud_run_revision \
  AND resource.labels.service_name=codementor-ai-engine \
  AND severity>=ERROR" \
  --limit=20 \
  --format=json
```

**Fix:**

```bash
# Increase timeout in Backend request config
# backend/routes/assessment.js
axios.defaults.timeout = 30000; // 30 seconds

# Increase Cloud Run timeout
gcloud run services update codementor-ai-engine \
  --region=us-central1 \
  --timeout=300 \
  --max-instances=10
```

---

### 8.2 Log Analysis

**View real-time logs:**

```bash
# Stream logs from all services
gcloud logging tail "resource.type=cloud_run_revision" --format=json

# Filter by service
gcloud logging tail "resource.type=cloud_run_revision \
  AND resource.labels.service_name=codementor-backend"

# Filter by severity
gcloud logging tail "resource.type=cloud_run_revision \
  AND severity>=ERROR"
```

**Search historical logs:**

```bash
# Last 1 hour of errors
gcloud logging read "resource.type=cloud_run_revision \
  AND resource.labels.service_name=codementor-backend \
  AND severity>=ERROR \
  AND timestamp>\"$(date -u -d '1 hour ago' '+%Y-%m-%dT%H:%M:%SZ')\"" \
  --limit=100 \
  --format=json

# Find specific error message
gcloud logging read "resource.type=cloud_run_revision \
  AND textPayload:\"AI_ENGINE_URL\"" \
  --limit=50

# Export to file for analysis
gcloud logging read "resource.type=cloud_run_revision \
  AND timestamp>\"2024-01-15T00:00:00Z\"" \
  --limit=1000 \
  --format=json > logs-export.json
```

**Structured log queries:**

```bash
# Find slow requests (>1s)
gcloud logging read "resource.type=cloud_run_revision \
  AND jsonPayload.httpRequest.latency>\"1s\"" \
  --limit=50

# Find failed Backend → AI Engine calls
gcloud logging read "resource.type=cloud_run_revision \
  AND resource.labels.service_name=codementor-backend \
  AND (textPayload:\"AI Engine error\" OR jsonPayload.error:\"AI Engine\")" \
  --limit=50
```

### 8.3 Network Diagnostics

**Test from Cloud Shell:**

```bash
# Activate Cloud Shell
gcloud cloud-shell ssh

# Test connectivity to services
curl -I https://codementor-backend-xxx.run.app/api/health

# Test with authentication
export TOKEN=$(gcloud auth print-identity-token \
  --audiences="https://codementor-ai-engine-xxx.run.app")

curl https://codementor-ai-engine-xxx.run.app/health \
  -H "Authorization: Bearer $TOKEN" \
  -v
```

**DNS resolution:**

```bash
# Check DNS resolution
nslookup codementor-backend-xxx.run.app

# Expected output:
# Server: 8.8.8.8
# Address: 8.8.8.8#53
# Non-authoritative answer:
# Name: codementor-backend-xxx.run.app
# Address: <IP>
```

**SSL/TLS verification:**

```bash
# Check SSL certificate
echo | openssl s_client -servername codementor-backend-xxx.run.app \
  -connect codementor-backend-xxx.run.app:443 2>/dev/null | \
  openssl x509 -noout -dates

# Expected: Valid certificate with future expiry date
```

### 8.4 Debugging Checklist

When a service can't communicate:

- [ ] Service is deployed and running
- [ ] Environment variables are set correctly
- [ ] IAM permissions are granted
- [ ] CORS is configured (Frontend → Backend)
- [ ] Authentication tokens are valid (Backend → AI Engine)
- [ ] Service URLs are correct (no typos)
- [ ] Ingress settings allow traffic
- [ ] No recent code changes broke the connection
- [ ] Logs show actual error details
- [ ] Network connectivity from Cloud Shell works

---

## 9. Security Best Practices

### 9.1 Authentication & Authorization

✅ **DO:**

- Use Google Cloud IAM for service-to-service authentication
- Use short-lived identity tokens (auto-refresh)
- Apply least privilege principle (minimum required roles)
- Separate service accounts for different services
- Use Secret Manager for API keys and credentials

❌ **DON'T:**

- Use long-lived service account keys in production
- Share service accounts between unrelated services
- Store secrets in environment variables
- Allow `allUsers` access to internal services
- Hardcode credentials in code

### 9.2 Network Security

**Ingress Control:**

```bash
# Frontend: Public (web app)
gcloud run services update codementor-frontend \
  --ingress=all

# Backend: Public but consider rate limiting
gcloud run services update codementor-backend \
  --ingress=all

# AI Engine: Internal only (service-to-service)
gcloud run services update codementor-ai-engine \
  --ingress=internal-and-cloud-load-balancing
```

**TLS Enforcement:**

All Cloud Run services automatically enforce HTTPS. To ensure clients use HTTPS:

```javascript
// backend/middleware/enforce-https.js
module.exports = (req, res, next) => {
  if (req.headers['x-forwarded-proto'] !== 'https' && process.env.NODE_ENV === 'production') {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
};
```

### 9.3 Secrets Management

**Using Google Secret Manager:**

```bash
# Create secret
echo -n "your-secret-value" | gcloud secrets create my-secret --data-file=-

# Grant access to service account
gcloud secrets add-iam-policy-binding my-secret \
  --member="serviceAccount:codementor-ai-engine@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Use in Cloud Run
gcloud run services update codementor-ai-engine \
  --region=us-central1 \
  --update-secrets="MY_SECRET=my-secret:latest"
```

**Access in code (Python):**

```python
from google.cloud import secretmanager

client = secretmanager.SecretManagerServiceClient()
name = f"projects/{project_id}/secrets/my-secret/versions/latest"
response = client.access_secret_version(request={"name": name})
secret_value = response.payload.data.decode("UTF-8")
```

### 9.4 API Security

**Rate Limiting:**

```javascript
// backend/middleware/rate-limit.js
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);
```

**Input Validation:**

```javascript
// backend/middleware/validate.js
const { body, validationResult } = require('express-validator');

const validateCodeSubmission = [
  body('sessionId').isUUID().withMessage('Invalid session ID'),
  body('code').notEmpty().withMessage('Code is required'),
  body('language').isIn(['python', 'javascript', 'typescript']).withMessage('Invalid language'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

router.post('/code-test/submit', validateCodeSubmission, async (req, res) => {
  // Handle request
});
```

### 9.5 Monitoring & Alerting

**Set up uptime checks:**

```bash
# Create uptime check for Backend
gcloud monitoring uptime-checks create https codementor-backend-uptime \
  --display-name="CodeMentor Backend Health" \
  --uri="https://codementor-backend-xxx.run.app/api/health" \
  --checker-regions=usa,europe,asia-pacific

# Create alert policy
gcloud alpha monitoring policies create \
  --display-name="Backend Down Alert" \
  --condition-display-name="Backend Health Check Failed" \
  --condition-threshold-value=1 \
  --condition-threshold-duration=60s \
  --notification-channels=CHANNEL_ID
```

**Create log-based metrics:**

```bash
# Metric for 5xx errors
gcloud logging metrics create backend_5xx_errors \
  --description="Count of 5xx errors from Backend" \
  --log-filter='resource.type="cloud_run_revision"
    AND resource.labels.service_name="codementor-backend"
    AND httpRequest.status>=500'

# Alert on high error rate
gcloud alpha monitoring policies create \
  --display-name="High Backend Error Rate" \
  --condition-display-name="5xx errors > 10/min" \
  --condition-threshold-value=10 \
  --condition-threshold-duration=60s \
  --notification-channels=CHANNEL_ID
```

---

## 10. Quick Reference

### 10.1 Essential Commands

```bash
# Get service URLs
gcloud run services list --platform=managed --region=us-central1

# View service details
gcloud run services describe SERVICE_NAME --region=us-central1

# Update environment variables
gcloud run services update SERVICE_NAME \
  --region=us-central1 \
  --update-env-vars="KEY=value"

# Grant IAM permission
gcloud run services add-iam-policy-binding SERVICE_NAME \
  --region=us-central1 \
  --member="serviceAccount:SA_EMAIL" \
  --role="roles/run.invoker"

# View logs
gcloud logging tail "resource.type=cloud_run_revision \
  AND resource.labels.service_name=SERVICE_NAME"

# Generate identity token
gcloud auth print-identity-token --audiences="SERVICE_URL"
```

### 10.2 Service URLs

```bash
# Export all service URLs
export FRONTEND_URL=$(gcloud run services describe codementor-frontend \
  --region=us-central1 --format='value(status.url)')

export BACKEND_URL=$(gcloud run services describe codementor-backend \
  --region=us-central1 --format='value(status.url)')

export AI_ENGINE_URL=$(gcloud run services describe codementor-ai-engine \
  --region=us-central1 --format='value(status.url)')

# Print for reference
echo "Frontend: $FRONTEND_URL"
echo "Backend: $BACKEND_URL"
echo "AI Engine: $AI_ENGINE_URL"
```

### 10.3 Common Endpoints

**Frontend:**
- `GET /` - Web application homepage
- `GET /_next/static/*` - Static assets

**Backend:**
- `GET /api/health` - Health check
- `POST /api/onboarding/session` - Create onboarding session
- `POST /api/assessment/code-test/start` - Start code assessment
- `POST /api/assessment/code-test/submit` - Submit code solution

**AI Engine:**
- `GET /health` - Health check
- `POST /assess/code-test/start` - Start code test
- `POST /assess/code-test/submit` - Submit code for evaluation
- `POST /assess/interview/start` - Start interview assessment

### 10.4 Troubleshooting Quick Fixes

| Problem | Quick Fix |
|---------|-----------|
| 403 Forbidden on AI Engine | `gcloud run services add-iam-policy-binding codementor-ai-engine --member="serviceAccount:BACKEND_SA" --role="roles/run.invoker"` |
| CORS error | Add Frontend URL to Backend CORS config |
| ENV var not set | `gcloud run services update SERVICE --update-env-vars="KEY=value"` |
| Service not responding | Check logs: `gcloud logging tail "resource.labels.service_name=SERVICE"` |
| 502 Bad Gateway | Check if service is crashing on startup (view logs) |

### 10.5 Security Checklist

- [ ] All services use HTTPS
- [ ] Secrets in Secret Manager (not env vars)
- [ ] Service accounts follow least privilege
- [ ] AI Engine has `ingress=internal-and-cloud-load-balancing`
- [ ] CORS configured correctly for Frontend domain
- [ ] Rate limiting enabled on public APIs
- [ ] Input validation on all POST endpoints
- [ ] Monitoring and alerting set up
- [ ] No service account keys in Git repository
- [ ] All API keys rotated regularly

---

## 📚 Additional Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Service-to-Service Authentication](https://cloud.google.com/run/docs/authenticating/service-to-service)
- [Cloud Run IAM Permissions](https://cloud.google.com/run/docs/reference/iam/roles)
- [Secret Manager Best Practices](https://cloud.google.com/secret-manager/docs/best-practices)
- [Cloud Run Networking](https://cloud.google.com/run/docs/configuring/vpc-connectors)
- [Monitoring Cloud Run](https://cloud.google.com/run/docs/monitoring)

---

**Last Updated:** 2024-01-15  
**Version:** 1.0.0  
**Maintained By:** CodeMentor DevOps Team
