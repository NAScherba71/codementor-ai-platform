# CodeMentor AI - Intelligent Programming Learning Platform

## Python AI Engine for Personalized Learning

This microservice powers the intelligent features of CodeMentor AI, including:
- Adaptive challenge generation
- Personalized learning path recommendations
- Code analysis and feedback
- AI-powered tutoring system

### Features

- **Adaptive Challenge Generation**: Creates personalized coding challenges based on user skill level
- **Code Analysis**: Analyzes student code for patterns, errors, and improvements
- **Learning Path Optimization**: Recommends optimal learning sequences
- **Natural Language Processing**: Powers conversational AI tutors
- **Custom ML Models**: Uses locally-hosted models instead of expensive third-party APIs

### Custom ML Models

**No OpenAI API Key Required!** This engine now uses custom, lightweight ML models:

- **Chat Model**: TinyLlama-1.1B-Chat (1.1B parameters) - Fast, efficient conversational AI
- **Code Analysis**: CodeT5-Small - Specialized for code understanding and suggestions
- **Local Inference**: All models run locally, reducing costs and improving privacy

### Requirements

- Python 3.9+
- PyTorch 2.x
- Transformers (Hugging Face)
- TensorFlow 2.x
- scikit-learn
- Redis (for caching)
- ~4GB disk space for model cache
- **No OpenAI API Key required!**

### Installation

```bash
cd ai-engine
pip install -r requirements.txt
```

### Model Setup

Download and cache the required models (first time only):

```bash
python init_models.py
```

This will download:
- TinyLlama-1.1B-Chat model (~2.2GB)
- CodeT5-Small model (~500MB)

Models are cached locally and only need to be downloaded once.

### Configuration

Create a `.env` file (OpenAI key no longer needed):

```
REDIS_URL=redis://localhost:6379
DATABASE_URL=your_database_url
MODEL_CACHE_DIR=/path/to/model/cache  # Optional, defaults to /tmp/model_cache
```

### Running the Service

```bash
python main.py
```

The AI engine will start on port 5000 and expose REST API endpoints for the main application.

### API Endpoints

- `POST /ai-tutor/chat` - AI tutor conversational interface (uses TinyLlama)
- `POST /llm/chat` - Unified LLM chat (local, Gemini, OpenRouter)
- `POST /code/analyze` - Code analysis with AI insights (uses CodeT5)
- `POST /challenges/generate` - Adaptive challenge generation
- `POST /learning-path/recommend` - Personalized learning paths
- `GET /health` - Health check

### LLM Providers (step-by-step)

Use `POST /llm/chat` with a `provider` value of `local`, `gemini`, or `openrouter`.

#### 1) Local LLM (TinyLlama)

1. Install dependencies and cache models:
   ```bash
   cd ai-engine
   pip install -r requirements.txt
   python init_models.py
   ```
2. Run the service:
   ```bash
   python main.py
   ```
3. Test local chat:
   ```bash
   curl -X POST http://localhost:5000/llm/chat \\
     -H 'Content-Type: application/json' \\
     -d '{"provider":"local","message":"Explain closures in Python"}'
   ```

#### 2) Gemini (Vertex AI)

1. Set environment variables:
   ```bash
   export GCP_PROJECT_ID=your-project-id
   export GCP_LOCATION=us-central1
   export GEMINI_MODEL=gemini-1.5-flash-001
   ```
2. Ensure Vertex AI auth is configured (service account or `gcloud auth application-default login`).
3. Run the service and test Gemini:
   ```bash
   curl -X POST http://localhost:5000/llm/chat \\
     -H 'Content-Type: application/json' \\
     -d '{"provider":"gemini","message":"Suggest performance improvements for a recursive Fibonacci"}'
   ```

#### 3) OpenRouter

1. Set API key and optional model:
   ```bash
   export OPENROUTER_API_KEY=your-key
   export OPENROUTER_MODEL=openai/gpt-4o-mini
   ```
2. Run the service and test OpenRouter:
   ```bash
   curl -X POST http://localhost:5000/llm/chat \\
     -H 'Content-Type: application/json' \\
     -d '{"provider":"openrouter","message":"Review this code for security issues"}'
   ```

### Performance

- **Latency**: ~1-3 seconds per request (CPU), <1 second (GPU)
- **Memory**: ~2-4GB RAM for model loading
- **Cost**: $0 per request (no API fees!)

### GPU Support (Optional)

For faster inference, use a GPU:

```bash
# Install CUDA-enabled PyTorch
pip install torch --index-url https://download.pytorch.org/whl/cu118
```

The engine automatically detects and uses GPU if available.
