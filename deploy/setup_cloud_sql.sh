#!/bin/bash

# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  🗄️ CodeMentor AI - Cloud SQL Setup Script                              ║
# ║  Sets up MongoDB-compatible database for Cloud Run deployment            ║
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
        export $(grep -v '^#' .env | xargs)
    fi
    
    export PROJECT_ID="${GCP_PROJECT_ID:-}"
    export REGION="${GCP_REGION:-us-central1}"
    
    if [ -z "$PROJECT_ID" ]; then
        log_error "GCP_PROJECT_ID is not set"
        exit 1
    fi
    
    log_success "Project ID: $PROJECT_ID"
    log_success "Region: $REGION"
}

# Main function
main() {
    log_section "🗄️ Cloud SQL Setup for CodeMentor AI"
    
    load_environment
    
    log_warning "Cloud SQL for MongoDB is not directly supported by GCP."
    log_info "Recommended database options for Cloud Run:"
    echo ""
    echo "  1. MongoDB Atlas (Recommended)"
    echo "     - Fully managed MongoDB service"
    echo "     - Easy integration with Cloud Run"
    echo "     - Free tier available"
    echo "     - Setup: https://www.mongodb.com/cloud/atlas"
    echo ""
    echo "  2. Firestore (GCP Native)"
    echo "     - NoSQL document database"
    echo "     - Native GCP integration"
    echo "     - Automatic scaling"
    echo "     - Free tier available"
    echo ""
    echo "  3. Cloud SQL for PostgreSQL/MySQL"
    echo "     - Relational database option"
    echo "     - Use with Prisma or TypeORM"
    echo "     - Requires schema migration from MongoDB"
    echo ""
    
    log_info "To use MongoDB Atlas:"
    echo "  1. Create a free cluster at https://www.mongodb.com/cloud/atlas"
    echo "  2. Add your Cloud Run service IP to IP Allowlist (or use 0.0.0.0/0 for testing)"
    echo "  3. Get connection string: mongodb+srv://username:password@cluster.mongodb.net/dbname"
    echo "  4. Store connection string in Secret Manager:"
    echo "     gcloud secrets create mongodb-uri --data-file=- <<< 'your-connection-string'"
    echo ""
    
    log_info "To use Firestore:"
    echo "  1. Enable Firestore API:"
    echo "     gcloud services enable firestore.googleapis.com"
    echo "  2. Create a Firestore database:"
    echo "     gcloud firestore databases create --region=$REGION"
    echo "  3. Update application code to use Firestore client library"
    echo ""
    
    log_success "Database setup information provided"
}

main "$@"
