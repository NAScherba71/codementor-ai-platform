# Backend Configuration Guide

This guide explains how to configure the frontend to communicate with the backend API service in different environments.

## Table of Contents

- [Overview](#overview)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Docker Compose](#docker-compose)
- [Cloud Run Deployment](#cloud-run-deployment)
- [Verifying Configuration](#verifying-configuration)
- [Troubleshooting](#troubleshooting)

## Overview

The CodeMentor AI Platform frontend needs to communicate with the backend API service. The backend URL is configured using environment variables, which differ based on your deployment environment.

### Configuration Priority

The frontend looks for backend URL configuration in this order:

1. `NEXT_PUBLIC_API_URL` - Primary configuration (accessible in browser)
2. `BACKEND_API_URL` - Server-side fallback
3. `http://localhost:3001` - Default fallback for local development

## Environment Variables

### `NEXT_PUBLIC_API_URL`

**Required for production deployments (Cloud Run)**

This is the primary configuration variable and should be set to the full URL of your backend service.

- **Local Development**: `http://localhost:3001`
- **Docker Compose**: `http://backend:3001`
- **Cloud Run**: `https://codementor-backend-{PROJECT_NUMBER}.{REGION}.run.app`

```bash
# Example for Cloud Run
NEXT_PUBLIC_API_URL=https://codementor-backend-31499486874.us-central1.run.app
```

### Why `NEXT_PUBLIC_` Prefix?

In Next.js, environment variables prefixed with `NEXT_PUBLIC_` are:
- Exposed to the browser (client-side)
- Embedded in the JavaScript bundle at build time
- Accessible via `process.env.NEXT_PUBLIC_*`

This is necessary because the frontend's browser-side code needs to know where to send API requests.

## Local Development

### Step 1: Create `.env.local`

Copy the example file and customize:

```bash
cd frontend
cp .env.example .env.local
```

### Step 2: Configure Backend URL

Edit `.env.local`:

```bash
# For local development (backend running on localhost)
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Step 3: Start Services

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev
```

### Step 4: Verify Connection

Visit http://localhost:3000 and check the browser console. You should see:

```
✓ Backend URL configured: http://localhost:3001
  Environment: development
  Explicitly configured: Yes
```

## Docker Compose

When using Docker Compose, services communicate via Docker's internal network.

### Configuration

In `frontend/.env.local` or `docker-compose.yml`:

```bash
NEXT_PUBLIC_API_URL=http://backend:3001
```

Note: `backend` is the service name in `docker-compose.yml`, and Docker DNS resolves it to the correct container.

### Starting with Docker Compose

```bash
docker-compose up -d
```

### Verifying

Check logs:

```bash
docker-compose logs frontend | grep "Backend URL"
```

## Cloud Run Deployment

For production deployment on Google Cloud Run, proper configuration is **critical**.

### Step 1: Get Your Backend URL

After deploying the backend service:

```bash
# List Cloud Run services
gcloud run services list --region=us-central1

# Or get specific service URL
gcloud run services describe codementor-backend \
  --region=us-central1 \
  --format='value(status.url)'
```

Example output:
```
https://codementor-backend-31499486874.us-central1.run.app
```

### Step 2: Set Environment Variable

When deploying the frontend, set the environment variable:

#### Option A: Using gcloud CLI

```bash
gcloud run deploy codementor-frontend \
  --image=us-central1-docker.pkg.dev/PROJECT_ID/app/frontend:latest \
  --region=us-central1 \
  --set-env-vars="NEXT_PUBLIC_API_URL=https://codementor-backend-31499486874.us-central1.run.app"
```

#### Option B: Using Terraform

In `infrastructure/terraform/main.tf`:

```hcl
resource "google_cloud_run_v2_service" "frontend" {
  # ... other configuration ...
  
  template {
    containers {
      env {
        name  = "NEXT_PUBLIC_API_URL"
        value = google_cloud_run_v2_service.backend.uri
      }
    }
  }
}
```

#### Option C: Using Cloud Console

1. Go to Cloud Run console
2. Select `codementor-frontend` service
3. Click "Edit & Deploy New Revision"
4. Under "Environment Variables", add:
   - Name: `NEXT_PUBLIC_API_URL`
   - Value: `https://codementor-backend-{YOUR_URL}.run.app`
5. Deploy

### Step 3: Rebuild Frontend (Important!)

⚠️ **Critical**: Because `NEXT_PUBLIC_*` variables are embedded at build time, you must:

1. Set the environment variable
2. **Rebuild the Docker image**
3. Deploy the new image

```bash
# Build with the environment variable
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://your-backend-url.run.app \
  -t us-central1-docker.pkg.dev/PROJECT/app/frontend:latest \
  ./frontend

# Push
docker push us-central1-docker.pkg.dev/PROJECT/app/frontend:latest

# Deploy
gcloud run deploy codementor-frontend \
  --image=us-central1-docker.pkg.dev/PROJECT/app/frontend:latest \
  --region=us-central1
```

## Verifying Configuration

### Method 1: Health Check Endpoint

Visit your frontend URL and add `/api/health`:

```bash
curl https://your-frontend-url.run.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "frontend": "healthy",
  "backend": "healthy",
  "backend_url": "https://your-backend-url.run.app",
  "is_configured": true,
  "timestamp": "2024-01-23T10:00:00.000Z",
  "checks": {
    "environment": "production",
    "config_valid": true,
    "backend_reachable": true
  }
}
```

### Method 2: Browser Console

Open your frontend in a browser and check the console (F12). Look for:

```
✓ Backend URL configured: https://your-backend-url.run.app
  Environment: production
  Explicitly configured: Yes
```

### Method 3: Test Code Analysis

1. Go to the frontend
2. Click "Run" on the code editor
3. Check for errors

If configured correctly, you should not see "Backend URL not configured" errors.

## Troubleshooting

### Issue 1: "Failed to analyze code: 500"

**Symptom**: Users see a generic 500 error when running code analysis.

**Causes & Solutions**:

1. **Backend URL not set**
   ```
   Error: Cannot connect to backend service
   Likely cause: Backend URL not configured for Cloud Run deployment
   Solution: Set NEXT_PUBLIC_API_URL environment variable
   ```
   
   **Fix**: Follow [Cloud Run Deployment](#cloud-run-deployment) steps above.

2. **Using localhost in production**
   ```
   Backend URL: http://localhost:3001 (not configured - using fallback)
   ```
   
   **Fix**: Set `NEXT_PUBLIC_API_URL` to your actual Cloud Run URL and redeploy.

3. **Wrong backend URL**
   ```
   Error: fetch failed
   Details: getaddrinfo ENOTFOUND incorrect-url.run.app
   ```
   
   **Fix**: Verify the backend URL is correct. Get it from `gcloud run services list`.

### Issue 2: Backend URL Shows localhost in Production

**Check**: Visit `/api/health` endpoint and look at `backend_url` and `is_configured`.

**If `is_configured: false`**:
- The environment variable was not set during build
- Rebuild the Docker image with `--build-arg NEXT_PUBLIC_API_URL=...`
- Redeploy

### Issue 3: Changes Not Taking Effect

**Remember**: `NEXT_PUBLIC_*` variables are **build-time**, not runtime.

**Solution**:
1. Update environment variable
2. **Rebuild** Docker image
3. **Redeploy** new image

```bash
# Not enough - won't work!
gcloud run deploy frontend --set-env-vars="NEXT_PUBLIC_API_URL=..."

# Correct approach
docker build --build-arg NEXT_PUBLIC_API_URL=... -t ... ./frontend
docker push ...
gcloud run deploy frontend --image=...
```

### Issue 4: CORS Errors

**Symptom**: Browser shows CORS policy errors.

**Fix**: Ensure backend's CORS configuration allows requests from frontend URL:

In backend configuration:
```javascript
// backend/src/config/cors.js
const allowedOrigins = [
  'http://localhost:3000',
  'https://your-frontend-url.run.app'
];
```

### Issue 5: Timeout Errors

**Symptom**: "Backend service timeout" error after 30 seconds.

**Possible Causes**:
- Backend service is slow (cold start)
- Backend service has errors
- Network issues

**Debug**:
1. Check backend logs: `gcloud run services logs read codementor-backend`
2. Check backend health: `curl https://your-backend-url.run.app/health`
3. Increase Cloud Run timeout if needed

## Advanced Configuration

### Multiple Environments

Use different `.env` files:

```bash
# .env.local - local development
NEXT_PUBLIC_API_URL=http://localhost:3001

# .env.staging - staging environment
NEXT_PUBLIC_API_URL=https://backend-staging.run.app

# .env.production - production
NEXT_PUBLIC_API_URL=https://backend-prod.run.app
```

Build for specific environment:
```bash
docker build --build-arg ENV_FILE=.env.production ...
```

### Debugging

Enable debug mode to see more details:

```bash
NEXT_PUBLIC_DEBUG_MODE=true
```

This will show additional console logging for:
- Every proxy request
- Request/response timing
- Detailed error information

## Best Practices

1. **Always set `NEXT_PUBLIC_API_URL`** explicitly for production
2. **Never commit** `.env.local` files (they're gitignored)
3. **Document** your Cloud Run URLs in team documentation
4. **Test** the `/api/health` endpoint after each deployment
5. **Monitor** frontend logs for configuration warnings
6. **Use** Secret Manager for sensitive values (not `NEXT_PUBLIC_*`)

## Getting Help

If you're still experiencing issues:

1. Check `/api/health` endpoint output
2. Review browser console for error details
3. Check Cloud Run logs: `gcloud run services logs tail codementor-frontend`
4. See main [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md) for more information
5. Open an issue on GitHub with error details

## Quick Reference

| Environment | Backend URL Format | How to Set |
|-------------|-------------------|------------|
| Local Dev | `http://localhost:3001` | `.env.local` |
| Docker Compose | `http://backend:3001` | `.env.local` or `docker-compose.yml` |
| Cloud Run | `https://service-xxx.region.run.app` | `--build-arg` + `--set-env-vars` |

## Related Documentation

- [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md) - Full deployment instructions
- [.env.example](../.env.example) - All available environment variables
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables) - Official Next.js docs
