# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  🚀 CodeMentor AI Engine - Optimized for GCP Cloud Run                   ║
# ║  Priority: Local LLM Provider (TinyLlama-1.1B-Chat + CodeT5-Small)       ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

# Use Python 3.11 slim for smaller image size
FROM python:3.11-slim AS base

# Set environment variables for Python optimization
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies required for ML libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ═══════════════════════════════════════════════════════════════════════════
# Stage 1: Install Python dependencies
# ═══════════════════════════════════════════════════════════════════════════
FROM base AS dependencies

COPY requirements.txt .

# Install Python dependencies with optimizations
RUN pip install --no-cache-dir -r requirements.txt && \
    # Clean up pip cache to reduce image size
    rm -rf /root/.cache/pip

# ═══════════════════════════════════════════════════════════════════════════
# Stage 2: Production image
# ═══════════════════════════════════════════════════════════════════════════
FROM base AS production

# Copy installed dependencies from previous stage
COPY --from=dependencies /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=dependencies /usr/local/bin /usr/local/bin

# Create a non-root user for security
RUN useradd -m -u 1000 aiengine && \
    mkdir -p /app/models /app/logs && \
    chown -R aiengine:aiengine /app

# Copy application code
COPY --chown=aiengine:aiengine . .

# Switch to non-root user
USER aiengine

# ═══════════════════════════════════════════════════════════════════════════
# Environment Configuration
# ═══════════════════════════════════════════════════════════════════════════

# Cloud Run port (required)
ENV PORT=8080

# Flask configuration
ENV FLASK_ENV=production \
    FLASK_APP=main.py

# Model cache directory (use Cloud Storage mount or ephemeral storage)
ENV MODEL_CACHE_DIR=/app/models \
    HF_HOME=/app/models \
    TRANSFORMERS_CACHE=/app/models

# Disable TensorFlow warnings
ENV TRANSFORMERS_NO_TF=1 \
    TRANSFORMERS_NO_TORCHVISION=1 \
    TF_CPP_MIN_LOG_LEVEL=3

# Optimize PyTorch for CPU (default) or GPU
ENV TORCH_HOME=/app/models \
    OMP_NUM_THREADS=2 \
    MKL_NUM_THREADS=2

# Health check configuration
ENV HEALTH_CHECK_ENABLED=1

# Graceful shutdown timeout (seconds)
ENV SHUTDOWN_TIMEOUT=30

# ═══════════════════════════════════════════════════════════════════════════
# Expose Port
# ═══════════════════════════════════════════════════════════════════════════
EXPOSE 8080

# ═══════════════════════════════════════════════════════════════════════════
# Health Check (optional, Cloud Run has its own health checks)
# ═══════════════════════════════════════════════════════════════════════════
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# ═══════════════════════════════════════════════════════════════════════════
# Startup Command
# ═══════════════════════════════════════════════════════════════════════════
# Use gunicorn for production with graceful shutdown
CMD exec gunicorn \
    --bind 0.0.0.0:$PORT \
    --workers 1 \
    --threads 4 \
    --timeout 300 \
    --graceful-timeout $SHUTDOWN_TIMEOUT \
    --worker-class sync \
    --access-logfile - \
    --error-logfile - \
    --log-level info \
    main:app
