# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  📋 Terraform Variables                                                   ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

# ═══════════════════════════════════════════════════════════════════════════
# 🏗️ PROJECT CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════

variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "project_name" {
  description = "Human-readable project name"
  type        = string
  default     = "CodeMentor AI Platform"
}

variable "region" {
  description = "GCP Region for deploying resources"
  type        = string
  default     = "us-central1"
}

variable "billing_account" {
  description = "GCP Billing Account ID (optional)"
  type        = string
  default     = ""
}

variable "org_id" {
  description = "GCP Organization ID (optional)"
  type        = string
  default     = ""
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "dev"
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

# ═══════════════════════════════════════════════════════════════════════════
# 🤖 AI ENGINE CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════

variable "enable_vertex_ai" {
  description = "Enable Vertex AI APIs for multi-provider support"
  type        = bool
  default     = true
}

variable "chat_model" {
  description = "Chat model for TinyLlama"
  type        = string
  default     = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
}

variable "code_model" {
  description = "Code analysis model"
  type        = string
  default     = "Salesforce/codet5-small"
}

variable "vertex_model" {
  description = "Vertex AI model (optional)"
  type        = string
  default     = "gemini-pro"
}

# ═══════════════════════════════════════════════════════════════════════════
# ☁️ CLOUD RUN CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════

# Frontend Configuration
variable "frontend_memory" {
  description = "Memory allocation for Frontend service"
  type        = string
  default     = "512Mi"
}

variable "frontend_cpu" {
  description = "CPU allocation for Frontend service"
  type        = string
  default     = "1"
}

variable "frontend_min_instances" {
  description = "Minimum instances for Frontend (0 = scale to zero)"
  type        = number
  default     = 0
}

variable "frontend_max_instances" {
  description = "Maximum instances for Frontend"
  type        = number
  default     = 10
}

# Backend Configuration
variable "backend_memory" {
  description = "Memory allocation for Backend service"
  type        = string
  default     = "1Gi"
}

variable "backend_cpu" {
  description = "CPU allocation for Backend service"
  type        = string
  default     = "1"
}

variable "backend_min_instances" {
  description = "Minimum instances for Backend (0 = scale to zero)"
  type        = number
  default     = 0
}

variable "backend_max_instances" {
  description = "Maximum instances for Backend"
  type        = number
  default     = 10
}

# AI Engine Configuration
variable "ai_engine_memory" {
  description = "Memory allocation for AI Engine service"
  type        = string
  default     = "4Gi"
}

variable "ai_engine_cpu" {
  description = "CPU allocation for AI Engine service"
  type        = string
  default     = "2"
}

variable "ai_engine_min_instances" {
  description = "Minimum instances for AI Engine (0 = scale to zero, 1 = avoid cold starts)"
  type        = number
  default     = 0
}

variable "ai_engine_max_instances" {
  description = "Maximum instances for AI Engine"
  type        = number
  default     = 10
}

variable "ai_engine_timeout" {
  description = "Request timeout for AI Engine (seconds)"
  type        = string
  default     = "300s"
}

# ═══════════════════════════════════════════════════════════════════════════
# 💾 STORAGE CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════

variable "enable_model_cache_bucket" {
  description = "Create GCS bucket for model caching"
  type        = bool
  default     = true
}

variable "model_cache_bucket_name" {
  description = "GCS bucket name for model caching (will add project ID suffix)"
  type        = string
  default     = "codementor-models"
}

variable "model_cache_bucket_location" {
  description = "GCS bucket location (should match region)"
  type        = string
  default     = "US"
}

# ═══════════════════════════════════════════════════════════════════════════
# 🗄️ DATABASE CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════

variable "enable_cloud_sql" {
  description = "Enable Cloud SQL for MongoDB (experimental)"
  type        = bool
  default     = false
}

variable "mongodb_uri" {
  description = "MongoDB connection URI (use Secret Manager in production)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "redis_url" {
  description = "Redis connection URL (use Secret Manager in production)"
  type        = string
  default     = ""
  sensitive   = true
}

# ═══════════════════════════════════════════════════════════════════════════
# 🔐 SECURITY CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════

variable "enable_secret_manager" {
  description = "Enable Secret Manager for secure configuration"
  type        = bool
  default     = true
}

variable "jwt_secret" {
  description = "JWT secret key (use Secret Manager in production)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "cors_origin" {
  description = "CORS allowed origins (comma-separated)"
  type        = string
  default     = "*"
}

# ═══════════════════════════════════════════════════════════════════════════
# 📊 MONITORING CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════

variable "enable_cloud_monitoring" {
  description = "Enable Cloud Monitoring (Stackdriver)"
  type        = bool
  default     = true
}

variable "enable_cloud_logging" {
  description = "Enable Cloud Logging"
  type        = bool
  default     = true
}

variable "log_level" {
  description = "Application log level"
  type        = string
  default     = "INFO"
  
  validation {
    condition     = contains(["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"], var.log_level)
    error_message = "Log level must be one of: DEBUG, INFO, WARNING, ERROR, CRITICAL."
  }
}

# ═══════════════════════════════════════════════════════════════════════════
# 🏷️ RESOURCE LABELING
# ═══════════════════════════════════════════════════════════════════════════

variable "labels" {
  description = "Labels to apply to all resources"
  type        = map(string)
  default     = {}
}

# ═══════════════════════════════════════════════════════════════════════════
# 🚀 DEPLOYMENT CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════

variable "allow_unauthenticated_frontend" {
  description = "Allow public access to Frontend service"
  type        = bool
  default     = true
}

variable "allow_unauthenticated_backend" {
  description = "Allow public access to Backend service"
  type        = bool
  default     = true
}

variable "allow_unauthenticated_ai_engine" {
  description = "Allow public access to AI Engine service (should be false for production)"
  type        = bool
  default     = false
}
