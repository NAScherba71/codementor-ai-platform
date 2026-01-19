#!/bin/bash

# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  🔐 CodeMentor AI - Secret Manager Configuration Script                 ║
# ║  Sets up secrets in Google Cloud Secret Manager for secure deployment    ║
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
        # shellcheck disable=SC2046
        export $(grep -v '^#' .env | grep -v '^$' | xargs)
    fi
    
    export PROJECT_ID="${GCP_PROJECT_ID:-}"
    
    if [ -z "$PROJECT_ID" ]; then
        log_error "GCP_PROJECT_ID is not set in .env file"
        exit 1
    fi
    
    log_success "Project ID: $PROJECT_ID"
}

# Enable Secret Manager API
enable_secret_manager() {
    log_section "Enabling Secret Manager API"
    
    gcloud services enable secretmanager.googleapis.com --project="$PROJECT_ID"
    
    log_success "Secret Manager API enabled"
}

# Create or update a secret
create_or_update_secret() {
    local secret_name=$1
    local secret_value=$2
    local description=$3
    
    if [ -z "$secret_value" ]; then
        log_warning "Skipping $secret_name (no value provided)"
        return
    fi
    
    log_info "Creating/updating secret: $secret_name"
    
    # Check if secret exists
    if gcloud secrets describe "$secret_name" --project="$PROJECT_ID" &>/dev/null; then
        # Update existing secret
        echo -n "$secret_value" | gcloud secrets versions add "$secret_name" \
            --data-file=- \
            --project="$PROJECT_ID"
        log_success "Updated secret: $secret_name"
    else
        # Create new secret
        echo -n "$secret_value" | gcloud secrets create "$secret_name" \
            --data-file=- \
            --replication-policy="automatic" \
            --project="$PROJECT_ID"
        
        # Add labels
        gcloud secrets update "$secret_name" \
            --update-labels="managed-by=terraform,app=codementor" \
            --project="$PROJECT_ID"
        
        log_success "Created secret: $secret_name"
    fi
}

# Grant Cloud Run service accounts access to secrets
grant_secret_access() {
    local secret_name=$1
    local service_account=$2
    
    log_info "Granting access to $secret_name for $service_account"
    
    gcloud secrets add-iam-policy-binding "$secret_name" \
        --member="serviceAccount:$service_account" \
        --role="roles/secretmanager.secretAccessor" \
        --project="$PROJECT_ID"
}

# Create all required secrets
create_all_secrets() {
    log_section "Creating/Updating Secrets"
    
    # JWT Secret
    if [ -n "${JWT_SECRET:-}" ]; then
        create_or_update_secret "jwt-secret" "$JWT_SECRET" "JWT secret for authentication"
    else
        log_warning "JWT_SECRET not set in .env - generating random value"
        JWT_SECRET=$(openssl rand -base64 32)
        create_or_update_secret "jwt-secret" "$JWT_SECRET" "JWT secret for authentication"
    fi
    
    # MongoDB URI
    if [ -n "${MONGODB_URI:-}" ]; then
        create_or_update_secret "mongodb-uri" "$MONGODB_URI" "MongoDB connection string"
    else
        log_warning "MONGODB_URI not set in .env - skipping"
    fi
    
    # Redis URL
    if [ -n "${REDIS_URL:-}" ]; then
        create_or_update_secret "redis-url" "$REDIS_URL" "Redis connection URL"
    else
        log_warning "REDIS_URL not set in .env - skipping"
    fi
    
    # API Keys
    if [ -n "${JUDGE0_API_KEY:-}" ]; then
        create_or_update_secret "judge0-api-key" "$JUDGE0_API_KEY" "Judge0 API key for code execution"
    fi
    
    if [ -n "${GITHUB_CLIENT_SECRET:-}" ]; then
        create_or_update_secret "github-client-secret" "$GITHUB_CLIENT_SECRET" "GitHub OAuth client secret"
    fi
    
    if [ -n "${OPENROUTER_API_KEY:-}" ]; then
        create_or_update_secret "openrouter-api-key" "$OPENROUTER_API_KEY" "OpenRouter API key"
    fi
    
    # Stripe keys (optional)
    if [ -n "${STRIPE_SECRET_KEY:-}" ]; then
        create_or_update_secret "stripe-secret-key" "$STRIPE_SECRET_KEY" "Stripe secret key"
    fi
    
    if [ -n "${STRIPE_WEBHOOK_SECRET:-}" ]; then
        create_or_update_secret "stripe-webhook-secret" "$STRIPE_WEBHOOK_SECRET" "Stripe webhook secret"
    fi
}

# Grant access to service accounts
grant_all_access() {
    log_section "Granting Secret Access to Service Accounts"
    
    local cloudrun_sa="codementor-cloudrun@${PROJECT_ID}.iam.gserviceaccount.com"
    local ai_engine_sa="codementor-ai-engine@${PROJECT_ID}.iam.gserviceaccount.com"
    
    # Grant access to all secrets for Cloud Run SA
    for secret in jwt-secret mongodb-uri redis-url judge0-api-key github-client-secret; do
        if gcloud secrets describe "$secret" --project="$PROJECT_ID" &>/dev/null; then
            grant_secret_access "$secret" "$cloudrun_sa" || true
        fi
    done
    
    # Grant access to AI Engine specific secrets
    for secret in openrouter-api-key; do
        if gcloud secrets describe "$secret" --project="$PROJECT_ID" &>/dev/null; then
            grant_secret_access "$secret" "$ai_engine_sa" || true
        fi
    done
    
    log_success "Secret access granted"
}

# Display usage instructions
show_usage() {
    log_section "📋 How to Use Secrets in Cloud Run"
    
    echo "1. Reference secrets as environment variables in Cloud Run:"
    echo ""
    echo "   gcloud run services update SERVICE_NAME \\"
    echo "     --update-secrets=JWT_SECRET=jwt-secret:latest \\"
    echo "     --update-secrets=MONGODB_URI=mongodb-uri:latest"
    echo ""
    echo "2. Or in Terraform (main.tf):"
    echo ""
    echo "   env {"
    echo "     name = \"JWT_SECRET\""
    echo "     value_source {"
    echo "       secret_key_ref {"
    echo "         secret  = \"jwt-secret\""
    echo "         version = \"latest\""
    echo "       }"
    echo "     }"
    echo "   }"
    echo ""
    echo "3. List all secrets:"
    echo "   gcloud secrets list --project=$PROJECT_ID"
    echo ""
    echo "4. View secret value (requires permissions):"
    echo "   gcloud secrets versions access latest --secret=SECRET_NAME --project=$PROJECT_ID"
    echo ""
}

# Main function
main() {
    log_section "🔐 Configuring Secrets for CodeMentor AI"
    
    load_environment
    enable_secret_manager
    create_all_secrets
    grant_all_access
    show_usage
    
    log_success "Secret configuration completed! 🎉"
}

main "$@"
