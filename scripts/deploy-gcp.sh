#!/bin/bash

# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  🚀 CodeMentor AI Platform - GCP Deployment Script                       ║
# ║  Automated workflow: gcloud builds → docker push → terraform apply       ║
# ║  Optimized for Google Cloud Run with Gemini 3 Pro best practices         ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
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

# Check if required tools are installed
check_prerequisites() {
    log_section "Checking Prerequisites"
    
    local tools=("gcloud" "docker" "terraform")
    local missing=()
    
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            missing+=("$tool")
            log_error "$tool is not installed"
        else
            log_success "$tool is installed"
        fi
    done
    
    if [ ${#missing[@]} -ne 0 ]; then
        log_error "Missing required tools: ${missing[*]}"
        log_info "Please install the missing tools and try again."
        exit 1
    fi
}

# Load environment variables
load_environment() {
    log_section "Loading Environment Variables"
    
    # Check if .env file exists
    if [ -f .env ]; then
        log_info "Loading .env file..."
        # Safely load .env file
        while IFS='=' read -r key value; do
            # Skip comments and empty lines
            [[ $key =~ ^#.*$ || -z $key ]] && continue
            # Remove leading/trailing whitespace
            key=$(echo "$key" | xargs)
            value=$(echo "$value" | xargs)
            # Export the variable
            export "$key=$value"
        done < .env
    else
        log_warning ".env file not found. Using default values or environment variables."
    fi
    
    # Set defaults if not provided
    export PROJECT_ID="${GCP_PROJECT_ID:-}"
    export REGION="${GCP_REGION:-us-central1}"
    export ENVIRONMENT="${ENVIRONMENT:-dev}"
    
    if [ -z "$PROJECT_ID" ]; then
        log_error "GCP_PROJECT_ID is not set. Please set it in .env or as an environment variable."
        exit 1
    fi
    
    log_success "Project ID: $PROJECT_ID"
    log_success "Region: $REGION"
    log_success "Environment: $ENVIRONMENT"
}

# Set active GCP project
set_gcp_project() {
    log_section "Configuring GCP Project"
    
    log_info "Setting active project to: $PROJECT_ID"
    gcloud config set project "$PROJECT_ID"
    
    log_info "Setting default region to: $REGION"
    gcloud config set run/region "$REGION"
    
    log_success "GCP project configured successfully"
}

# Build and push Docker images
build_and_push_images() {
    log_section "Building and Pushing Docker Images"
    
    local services=("frontend" "backend" "ai-engine")
    local registry="${REGION}-docker.pkg.dev/${PROJECT_ID}/app"
    
    log_info "Docker registry: $registry"
    
    # Configure Docker to use gcloud as credential helper
    gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet
    
    for service in "${services[@]}"; do
        log_info "Building $service..."
        
        local image_name="${registry}/${service}:latest"
        local image_tag="${registry}/${service}:$(date +%Y%m%d-%H%M%S)"
        
        # Build using Cloud Build for faster builds
        log_info "Submitting build to Cloud Build..."
        gcloud builds submit \
            --tag="$image_name" \
            --timeout=20m \
            "./${service}" \
            --quiet
        
        # Also tag with timestamp
        gcloud container images add-tag \
            "$image_name" \
            "$image_tag" \
            --quiet
        
        log_success "$service image built and pushed successfully"
        log_info "  - Latest: $image_name"
        log_info "  - Tagged: $image_tag"
    done
}

# Apply Terraform configuration
deploy_infrastructure() {
    log_section "Deploying Infrastructure with Terraform"
    
    cd infrastructure/terraform
    
    # Initialize Terraform
    log_info "Initializing Terraform..."
    terraform init -upgrade
    
    # Create terraform.tfvars if it doesn't exist
    if [ ! -f terraform.tfvars ]; then
        log_info "Creating terraform.tfvars..."
        cat > terraform.tfvars <<EOF
project_id       = "$PROJECT_ID"
region           = "$REGION"
environment      = "$ENVIRONMENT"
enable_vertex_ai = true
EOF
        log_success "terraform.tfvars created"
    fi
    
    # Plan
    log_info "Planning Terraform changes..."
    terraform plan -out=tfplan
    
    # Apply
    log_info "Applying Terraform configuration..."
    terraform apply tfplan
    
    log_success "Infrastructure deployed successfully"
    
    # Get service URLs
    log_info "Retrieving service URLs..."
    terraform output -json > outputs.json
    
    cd ../..
}

# Display deployment information
show_deployment_info() {
    log_section "Deployment Complete! 🎉"
    
    log_info "Service URLs:"
    
    # Extract URLs from Terraform outputs
    if [ -f infrastructure/terraform/outputs.json ]; then
        echo ""
        grep -E "(frontend|backend|ai_engine)_url" infrastructure/terraform/outputs.json || true
        echo ""
    fi
    
    log_info "To view logs:"
    echo "  Frontend:  gcloud run services logs read codementor-frontend --region=$REGION"
    echo "  Backend:   gcloud run services logs read codementor-backend --region=$REGION"
    echo "  AI Engine: gcloud run services logs read codementor-ai-engine --region=$REGION"
    
    log_info "To check service status:"
    echo "  gcloud run services list --region=$REGION"
    
    log_success "Deployment completed successfully! 🚀"
}

# Cleanup function for errors
cleanup_on_error() {
    log_error "Deployment failed. Check the logs above for details."
    exit 1
}

# Main deployment flow
main() {
    log_section "🚀 CodeMentor AI Platform - GCP Deployment"
    
    # Set trap for errors
    trap cleanup_on_error ERR
    
    # Execute deployment steps
    check_prerequisites
    load_environment
    set_gcp_project
    build_and_push_images
    deploy_infrastructure
    show_deployment_info
}

# Run main function
main "$@"
