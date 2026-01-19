#!/bin/bash

# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  🤖 CodeMentor AI - Model Cache Setup Script                            ║
# ║  Downloads and caches AI models to Google Cloud Storage                  ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_section() {
    echo -e "\n${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║  $1${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}\n"
}

# Load environment variables
load_environment() {
    log_section "Loading Environment Variables"
    
    if [ -f .env ]; then
        log_info "Loading .env file..."
        export $(grep -v '^#' .env | grep -v '^$' | xargs)
    fi
    
    export PROJECT_ID="${GCP_PROJECT_ID:-}"
    export BUCKET_NAME="${GCS_BUCKET_NAME:-codementor-models-${PROJECT_ID}}"
    export MODEL_CACHE_DIR="${MODEL_CACHE_DIR:-./ai-engine/models}"
    
    if [ -z "$PROJECT_ID" ]; then
        log_error "GCP_PROJECT_ID is not set"
        exit 1
    fi
    
    log_success "Project ID: $PROJECT_ID"
    log_success "Bucket Name: $BUCKET_NAME"
    log_success "Local Cache: $MODEL_CACHE_DIR"
}

# Create GCS bucket if it doesn't exist
create_bucket() {
    log_section "Creating GCS Bucket for Model Cache"
    
    if gsutil ls -b "gs://$BUCKET_NAME" &>/dev/null; then
        log_info "Bucket gs://$BUCKET_NAME already exists"
    else
        log_info "Creating bucket: gs://$BUCKET_NAME"
        gsutil mb -p "$PROJECT_ID" -l us "gs://$BUCKET_NAME"
        log_success "Bucket created successfully"
    fi
}

# Download models using Python script
download_models() {
    log_section "Downloading AI Models"
    
    log_info "Installing Python dependencies..."
    pip install -q torch transformers accelerate sentencepiece
    
    log_info "Running model download script..."
    cd ai-engine
    
    python3 - <<'EOF'
import os
import sys
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    import torch
    from transformers import AutoTokenizer, AutoModelForCausalLM, AutoModelForSeq2SeqLM
    
    cache_dir = os.getenv('MODEL_CACHE_DIR', './models')
    Path(cache_dir).mkdir(parents=True, exist_ok=True)
    
    # Download TinyLlama
    logger.info("Downloading TinyLlama-1.1B-Chat...")
    chat_tokenizer = AutoTokenizer.from_pretrained(
        "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
        cache_dir=cache_dir,
        trust_remote_code=True
    )
    chat_model = AutoModelForCausalLM.from_pretrained(
        "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
        cache_dir=cache_dir,
        dtype=torch.float32,
        low_cpu_mem_usage=True,
        trust_remote_code=True
    )
    logger.info("✅ TinyLlama downloaded")
    
    # Download CodeT5
    logger.info("Downloading CodeT5-Small...")
    code_tokenizer = AutoTokenizer.from_pretrained(
        "Salesforce/codet5-small",
        cache_dir=cache_dir,
        trust_remote_code=True
    )
    code_model = AutoModelForSeq2SeqLM.from_pretrained(
        "Salesforce/codet5-small",
        cache_dir=cache_dir,
        dtype=torch.float32,
        low_cpu_mem_usage=True,
        trust_remote_code=True
    )
    logger.info("✅ CodeT5 downloaded")
    
    logger.info("All models downloaded successfully!")
    
except Exception as e:
    logger.error(f"Failed to download models: {e}")
    sys.exit(1)
EOF
    
    cd ..
    log_success "Models downloaded to $MODEL_CACHE_DIR"
}

# Upload models to GCS
upload_models_to_gcs() {
    log_section "Uploading Models to GCS"
    
    log_info "Uploading models from $MODEL_CACHE_DIR to gs://$BUCKET_NAME/models/cache/"
    
    # Use gsutil with parallel uploads for faster transfer
    gsutil -m rsync -r "$MODEL_CACHE_DIR" "gs://$BUCKET_NAME/models/cache/"
    
    log_success "Models uploaded to GCS bucket"
}

# Verify upload
verify_upload() {
    log_section "Verifying Upload"
    
    log_info "Checking uploaded files..."
    gsutil ls -lh "gs://$BUCKET_NAME/models/cache/" | head -20
    
    log_success "Upload verified"
}

# Display usage instructions
show_usage() {
    log_section "📋 Using Cached Models in Cloud Run"
    
    echo "Option 1: Download models from GCS on startup (recommended)"
    echo "  - Add startup script to download from gs://$BUCKET_NAME/models/cache/"
    echo "  - Set MODEL_CACHE_DIR=/app/models in environment"
    echo "  - Grant storage.objectViewer role to AI Engine service account"
    echo ""
    echo "Option 2: Pre-bake models into Docker image"
    echo "  - Copy models during Docker build"
    echo "  - Larger image size (~2-4 GB)"
    echo "  - Faster cold starts (no download needed)"
    echo ""
    echo "To grant access to AI Engine service account:"
    echo "  gsutil iam ch serviceAccount:codementor-ai-engine@${PROJECT_ID}.iam.gserviceaccount.com:objectViewer gs://$BUCKET_NAME"
    echo ""
    echo "To manually download models in Cloud Run:"
    echo "  gsutil -m rsync -r gs://$BUCKET_NAME/models/cache/ /app/models/"
    echo ""
}

# Main function
main() {
    log_section "🤖 Setting Up Model Cache for CodeMentor AI"
    
    load_environment
    create_bucket
    download_models
    upload_models_to_gcs
    verify_upload
    show_usage
    
    log_success "Model cache setup completed! 🎉"
}

main "$@"
