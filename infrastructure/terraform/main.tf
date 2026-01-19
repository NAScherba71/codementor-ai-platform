# Other terraform configurations...

variable "enable_model_cache_bucket" {
  description = "Enable GCS bucket for caching AI models"
  type        = bool
  default     = true
}

variable "model_cache_bucket_name" {
  description = "Name for the model cache bucket"
  type        = string
  default     = "codementor-model-cache"
}

variable "model_cache_bucket_location" {
  description = "Location for the model cache bucket"
  type        = string
  default     = "US"
}
# ═══════════════════════════════════════════════════════════════════════════
# 📤 OUTPUTS
# ═══════════════════════════════════════════════════════════════════════════

output "frontend_url" {
  description = "URL of the frontend service"
  value       = google_cloud_run_v2_service.frontend.uri
}

output "backend_url" {
  description = "URL of the backend service"
  value       = google_cloud_run_v2_service.backend.uri
}

output "ai_engine_url" {
  description = "URL of the AI engine service"
  value       = google_cloud_run_v2_service.ai_engine.uri
}

output "artifact_registry" {
  description = "Artifact Registry repository"
  value       = google_artifact_registry_repository.app.id
}

output "deployer_service_account" {
  description = "Deployer service account email"
  value       = google_service_account.deployer.email
}

# Other terraform configurations...

resource "google_project_service" "storage_api" {
  // configurations for storage_api
  depends_on = [google_project_service.storage_api]
}