# Troubleshooting Guide

This guide helps you resolve common issues with the CodeMentor AI Platform.

## Table of Contents

- [Backend Connection Errors](#backend-connection-errors)
- [500 Error: "Failed to analyze code"](#500-error-failed-to-analyze-code)
- [503 Error: "Backend service not configured"](#503-error-backend-service-not-configured)
- [Health Check Endpoint](#health-check-endpoint)
- [Cloud Run Deployment Issues](#cloud-run-deployment-issues)

---

## Backend Connection Errors

### Symptoms
- Error messages like "Cannot connect to backend service"
- "Failed to analyze code: 500"
- "Backend service not configured"

### Common Causes

1. **Missing Environment Variable**
   - The `NEXT_PUBLIC_API_URL` is not set
   - The variable is set but with an incorrect URL

2. **Backend Service Not Running**
   - Backend service is down or not deployed
   - Backend service failed to start

3. **Network Issues**
   - Firewall blocking connections
   - CORS misconfiguration
   - DNS resolution issues

### Solutions

#### For Local Development

1. **Check Backend is Running**
   ```bash
   # In a separate terminal, start the backend
   cd backend
   npm run dev
   ```

2. **Verify Environment Variable**
   ```bash
   # In frontend directory, check .env.local
   cat .env.local | grep NEXT_PUBLIC_API_URL
   ```
   
   Should be:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

3. **Test Backend Directly**
   ```bash
   curl http://localhost:3001/health
   ```
   
   Should return a JSON response with status information.

#### For Production (Cloud Run)

1. **Get Backend URL**
   ```bash
   gcloud run services describe codementor-backend \
     --region=us-central1 \
     --format='value(status.url)'
   ```

2. **Set Environment Variable in Cloud Run**
   ```bash
   gcloud run services update codementor-frontend \
     --region=us-central1 \
     --set-env-vars="NEXT_PUBLIC_API_URL=https://codementor-backend-xxx.us-central1.run.app"
   ```

3. **Verify Deployment**
   ```bash
   # Check service logs
   gcloud run services logs read codementor-frontend --region=us-central1 --limit=50
   ```

---

## 500 Error: "Failed to analyze code"

### What This Means
The frontend tried to connect to the backend but the connection failed.

### Quick Fix

1. **Check Health Endpoint**
   Visit: `https://your-frontend-url.run.app/api/health`
   
   Healthy response:
   ```json
   {
     "status": "healthy",
     "frontend": { "status": "ok" },
     "backend": { 
       "configured": true,
       "status": "connected" 
     }
   }
   ```

2. **Check Backend Status**
   ```bash
   # For Cloud Run
   gcloud run services list --region=us-central1
   ```
   
   Make sure `codementor-backend` shows "Ready: True"

3. **Review Error Details**
   Open browser DevTools → Console → Look for detailed error logs

---

## 503 Error: "Backend service not configured"

### What This Means
In production environment, `NEXT_PUBLIC_API_URL` is not set.

### Solution

**For Cloud Run Deployment:**

1. **Set the environment variable:**
   ```bash
   # Get backend URL first
   BACKEND_URL=$(gcloud run services describe codementor-backend \
     --region=us-central1 \
     --format='value(status.url)')
   
   # Update frontend with backend URL
   gcloud run services update codementor-frontend \
     --region=us-central1 \
     --set-env-vars="NEXT_PUBLIC_API_URL=${BACKEND_URL}"
   ```

2. **Redeploy if needed:**
   ```bash
   # Trigger a new deployment
   gcloud run services update codementor-frontend \
     --region=us-central1 \
     --max-instances=10
   ```

3. **Verify:**
   ```bash
   # Check environment variables are set
   gcloud run services describe codementor-frontend \
     --region=us-central1 \
     --format='json' | jq '.spec.template.spec.containers[0].env'
   ```

**For Docker Deployment:**

Update your `docker-compose.yml`:
```yaml
services:
  frontend:
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:3001
```

---

## Health Check Endpoint

### Endpoint
`GET /api/health`

### Purpose
Checks the health of the frontend and its connection to the backend.

### Usage

```bash
# Local
curl http://localhost:3000/api/health

# Production
curl https://your-frontend-url.run.app/api/health
```

### Response Format

**Healthy System:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-23T10:00:00.000Z",
  "environment": "production",
  "frontend": {
    "status": "ok",
    "version": "1.0.0"
  },
  "backend": {
    "configured": true,
    "url": "[REDACTED]",
    "status": "connected"
  }
}
```

**Degraded System:**
```json
{
  "status": "degraded",
  "timestamp": "2026-01-23T10:00:00.000Z",
  "environment": "production",
  "frontend": {
    "status": "ok",
    "version": "1.0.0"
  },
  "backend": {
    "configured": true,
    "url": "[REDACTED]",
    "status": "unreachable"
  }
}
```

**Not Configured (Production):**
```json
{
  "status": "degraded",
  "timestamp": "2026-01-23T10:00:00.000Z",
  "environment": "production",
  "frontend": {
    "status": "ok",
    "version": "1.0.0"
  },
  "backend": {
    "configured": false,
    "url": "not configured",
    "status": "not configured"
  }
}
```

### Status Codes
- `200`: System is healthy
- `503`: System is degraded (backend unreachable or not configured)

---

## Cloud Run Deployment Issues

### Issue: Environment Variables Not Persisting

**Problem:** You set `NEXT_PUBLIC_API_URL` but it's not taking effect.

**Solution:**
Environment variables in Next.js that start with `NEXT_PUBLIC_` are bundled at **build time**, not runtime.

**Option 1: Rebuild with Environment Variable**
```bash
# Set variable before build
export NEXT_PUBLIC_API_URL=https://your-backend.run.app

# Build
npm run build

# Deploy the built version
```

> ⚠️ **CRITICAL LIMITATION**: Environment variables in Next.js that start with `NEXT_PUBLIC_` are bundled at **build time**, not runtime. This means you must rebuild the frontend whenever you change this variable. Simply updating the Cloud Run environment variable is NOT sufficient - the application must be rebuilt with the new value.

**Option 2: Use Runtime Configuration**
The platform now uses a proxy approach where the frontend proxies requests to the backend, so the `NEXT_PUBLIC_API_URL` is only used for the initial frontend → backend proxy connection, not from the browser.

### Issue: CORS Errors

**Problem:** Browser shows CORS errors when calling backend.

**Solution:**
The platform uses a proxy pattern (`/api/ai-console/*`) to avoid CORS issues. Make sure:

1. You're using the proxy endpoints (not calling backend directly from browser)
2. Backend is configured to allow requests from frontend URL

In `backend/server.js` or similar:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000'
}));
```

### Issue: 504 Gateway Timeout

**Problem:** Requests timeout after 30 seconds.

**Causes:**
1. Backend processing takes too long
2. Cloud Run cold start

**Solutions:**
1. Increase timeout in `frontend/src/app/api/ai-console/config.ts` (currently 30s)
2. Optimize backend processing
3. Use Cloud Run minimum instances to avoid cold starts:
   ```bash
   gcloud run services update codementor-backend \
     --region=us-central1 \
     --min-instances=1
   ```

---

## Logging and Debugging

### Frontend Logs (Cloud Run)
```bash
gcloud run services logs read codementor-frontend \
  --region=us-central1 \
  --limit=100
```

### Backend Logs (Cloud Run)
```bash
gcloud run services logs read codementor-backend \
  --region=us-central1 \
  --limit=100
```

### Browser DevTools
1. Open DevTools (F12)
2. Go to Console tab
3. Look for logs starting with:
   - `🔗 Backend URL:` - Shows configured backend URL
   - `📤 Proxying request to:` - Shows actual request
   - `📥 Response status:` - Shows response from backend
   - `❌` - Error indicators

### Enable Debug Mode
In `.env.local`:
```
NEXT_PUBLIC_DEBUG_MODE=true
```

This enables additional logging in the browser console.

---

## Getting Help

If you're still experiencing issues:

1. **Check Health Endpoint:** Visit `/api/health` to see system status
2. **Review Logs:** Check both frontend and backend logs
3. **Verify Configuration:** Ensure all environment variables are set correctly
4. **Test Backend:** Try calling backend endpoints directly with curl/Postman
5. **Create an Issue:** If all else fails, create an issue with:
   - Error message
   - Health endpoint response
   - Relevant logs
   - Steps to reproduce

---

## Quick Reference

### Required Environment Variables

**Frontend:**
```bash
NEXT_PUBLIC_API_URL=https://your-backend-url.run.app
```

**Backend:**
```bash
PORT=3001
FRONTEND_URL=https://your-frontend-url.run.app
```

### Test Commands

```bash
# Test health
curl http://localhost:3000/api/health

# Test backend directly
curl http://localhost:3001/health

# Test analysis endpoint (through proxy)
curl -X POST http://localhost:3000/api/ai-console/analyze \
  -H "Content-Type: application/json" \
  -d '{"code":"print(\"hello\")", "language":"python"}'
```

### Cloud Run Commands

```bash
# List services
gcloud run services list --region=us-central1

# Get service URL
gcloud run services describe SERVICE_NAME \
  --region=us-central1 \
  --format='value(status.url)'

# Update environment variable
gcloud run services update SERVICE_NAME \
  --region=us-central1 \
  --set-env-vars="KEY=VALUE"

# View logs
gcloud run services logs read SERVICE_NAME \
  --region=us-central1 \
  --limit=50
```
