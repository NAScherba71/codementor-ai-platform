# CodeMentor AI Platform

A "Community-Gated" programming learning platform built with a 3-service architecture on Google Cloud.

## Services

1. **Frontend**: Next.js (Stateless, SSR/Static) - `/frontend`
2. **Backend**: Node.js/Express API - `/backend`
3. **AI Engine**: Python/Flask - `/ai-engine`

## Features

- **Self-Evolution System**: Automated code analysis, generation, testing, and history tracking for continuous improvement.
- **Assessment Module**: Rigorous developer evaluation through coding tests with timers and AI-powered interviews.
- **GCP Integration**: Monitoring of AI credits and seamless cloud operations.
- **Local Migration**: Support for Ollama and ChromaDB for cost-free, eternal operation without cloud dependencies.

## Architecture

```
Frontend (Next.js) → Backend (Express) → AI Engine (Flask)
                                       ├─ Self-Evolution
                                       ├─ Assessment
                                       ├─ GCP Integration
                                       └─ Local Models
                                          ↓
                                Vertex AI ⟷ Ollama
                                (Bootstrap) (Eternal)
```

The platform uses a 3-service architecture with interactions between frontend, backend, and AI engine. Transition from Vertex AI (bootstrap phase) to Ollama (eternal phase) for local model support.

## Deployment

Deployment is managed by **Google Cloud Build** via the `/******` comment trigger on Pull Requests.

The pipeline (`cloudbuild.yaml`) performs:
1. Frontend Install & Lint
2. AI Engine Tests
3. Parallel Docker Builds
4. Image Pushing to Artifact Registry

### ⚠️ Important: Environment Configuration for Production

**Required Environment Variable:**

The frontend **MUST** have `NEXT_PUBLIC_API_URL` set to the backend service URL in production:

```bash
# For Cloud Run deployment
gcloud run services update codementor-frontend \
  --region=us-central1 \
  --set-env-vars="NEXT_PUBLIC_API_URL=https://codementor-backend-xxx.us-central1.run.app"
```

**Without this configuration:**
- Users will see "Backend service not configured" error (503)
- Code analysis will fail
- Health check endpoint (`/api/health`) will show degraded status

**Testing deployment:**
```bash
# Check health endpoint
curl https://your-frontend-url.run.app/api/health

# Should show backend as "connected" not "unreachable"
```

For detailed troubleshooting, see [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md).

### Phase 1: GCP Bootstrap

1. Set up Google Cloud Project with Vertex AI enabled.
2. Configure environment variables:
   - `GOOGLE_CLOUD_PROJECT`: Your GCP project ID
   - `VERTEX_AI_LOCATION`: e.g., us-central1
   - `AI_ENGINE_PORT`: 5000
   - `BACKEND_PORT`: 3001
   - `FRONTEND_PORT`: 3000
3. Run `gcloud builds submit --config cloudbuild.yaml .`

### Phase 2: Local Migration

1. Install Ollama and ChromaDB locally.
2. Update environment variables for local models:
   - `OLLAMA_BASE_URL`: http://localhost:11434
   - `CHROMA_DB_PATH`: ./chroma_db
3. Use migration script: `./deploy/migrate_to_local.sh`
4. Run services locally with updated configs.

## Testing

### Manual Testing Checklist
- Self-evolution cycle: Analyze → Generate → Test → History
- Coding tests: Timer functionality and submission
- Interviews: AI response quality
- GCP integration: Credit monitoring
- Local migration: Ollama/ChromaDB functionality

### Automated Testing
- Unit tests for AI Engine models and services
- Integration tests for API endpoints
- End-to-end tests for full workflows

## Security

- Sandboxed execution for code testing
- Isolation between services
- Recommendations: Implement authentication, rate limiting, and input validation

## Performance

- Self-evolution cycle: ~5-10 seconds per iteration
- Assessment tests: <2 seconds response time
- GCP API calls: Optimized for cost and speed

## Statistics & Outcomes

- Total code added: ~4500 lines
- New modules: Self-evolution, assessment, GCP integration
- Success criteria: Self-improving AI, cost optimization, rigorous evaluation
- Learning outcomes: Platform adapts and improves autonomously

## Documentation

- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md): Detailed implementation notes
- [TRANSFORMATION_GUIDE.md](TRANSFORMATION_GUIDE.md): Transformation process
- [SECURITY_SUMMARY.md](SECURITY_SUMMARY.md): Security details

## Codex Automation (GitHub Actions)

This repository includes a manual GitHub Actions workflow that can apply changes from OpenAI Codex.

### Setup

1. Add repository secret `OPENAI_API_KEY` with an OpenAI API key.
2. (Optional) Update the default model in `.github/workflows/codex-bot.yml`.

### Run

1. Open **Actions** → **🤖 Codex Apply**.
2. Click **Run workflow**.
3. Provide plain-text instructions (for example: "Fix the AI Console API proxying to backend").

The workflow will:
- generate a patch via OpenAI,
- apply it to the repo,
- commit and push the result to the current branch.

## Local Development

Each service contains its own setup instructions (check `package.json` or usage files if available).
