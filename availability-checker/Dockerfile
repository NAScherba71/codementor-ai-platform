# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  🔍 Availability Checker Microservice - Optimized for Cloud Run          ║
# ║  Lightweight Python service for monitoring CodeMentor platform health    ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

# Use Python 3.11 slim for smaller image size
FROM python:3.11-slim AS base

# Set environment variables for Python optimization
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install minimal system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
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
    rm -rf /root/.cache/pip

# ═══════════════════════════════════════════════════════════════════════════
# Stage 2: Production image
# ═══════════════════════════════════════════════════════════════════════════
FROM base AS production

# Copy installed dependencies from previous stage
COPY --from=dependencies /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=dependencies /usr/local/bin /usr/local/bin

# Create a non-root user for security
RUN useradd -m -u 1000 checker && \
    mkdir -p /app/logs && \
    chown -R checker:checker /app

# Copy application code
COPY --chown=checker:checker . .

# Switch to non-root user
USER checker

# ═══════════════════════════════════════════════════════════════════════════
# Environment Configuration
# ═══════════════════════════════════════════════════════════════════════════

# Cloud Run port (required)
ENV PORT=8080

# Flask configuration
ENV FLASK_ENV=production \
    FLASK_APP=main.py

# ═══════════════════════════════════════════════════════════════════════════
# Expose Port
# ═══════════════════════════════════════════════════════════════════════════
EXPOSE 8080

# ═══════════════════════════════════════════════════════════════════════════
# Health Check
# ═══════════════════════════════════════════════════════════════════════════
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# ═══════════════════════════════════════════════════════════════════════════
# Startup Command
# ═══════════════════════════════════════════════════════════════════════════
# Use gunicorn for production
CMD exec gunicorn \
    --bind 0.0.0.0:$PORT \
    --workers 2 \
    --threads 2 \
    --timeout 60 \
    --graceful-timeout 30 \
    --worker-class sync \
    --access-logfile - \
    --error-logfile - \
    --log-level info \
    main:app
