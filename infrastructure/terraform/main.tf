# Terraform Configuration

# Required variables
variable "project_id" {
  description = "Project ID"
  type        = string
}

variable "project_name" {
  description = "Project Name"
  type        = string
}

variable "region" {
  description = "Region"
  type        = string
}

variable "billing_account" {
  description = "Billing Account ID"
  type        = string
}

variable "org_id" {
  description = "Organization ID"
  type        = string
}

variable "environment" {
  description = "Environment"
  type        = string
}

variable "enable_vertex_ai" {
  description = "Enable Vertex AI"
  type        = bool
  default     = false
}

variable "enable_model_cache_bucket" {
  description = "Enable Model Cache Bucket"
  type        = bool
  default     = false
}

variable "model_cache_bucket_name" {
  description = "Model Cache Bucket Name"
  type        = string
}

variable "model_cache_bucket_location" {
  description = "Model Cache Bucket Location"
  type        = string
}

# Providers
provider "google" {
  project = var.project_id
  region  = var.region
}

# Locals
locals {
  # Define local variables if needed
}

# Resources
resource "google_project" "my_project" {
  name       = var.project_name
  project_id = var.project_id
  org_id     = var.org_id
  billing_account = var.billing_account
}

resource "google_project_service" "storage_api" {
  project = google_project.my_project.project_id
  service = "storage.googleapis.com"
}

resource "google_project_service" "vertex_ai_api" {
  project = google_project.my_project.project_id
  service = "aiplatform.googleapis.com"
}

resource "google_artifact_registry_repository" "my_repo" {
  repository_id   = "my-repository"
  format          = "docker"
  location        = var.model_cache_bucket_location
  project         = google_project.my_project.project_id
}

resource "google_service_account" "frontend_service_account" {
  account_id   = "frontend-sa"
  display_name = "Frontend Service Account"
  project      = google_project.my_project.project_id
}

resource "google_service_account" "backend_service_account" {
  account_id   = "backend-sa"
  display_name = "Backend Service Account"
  project      = google_project.my_project.project_id
}

resource "google_service_account" "ai_engine_service_account" {
  account_id   = "ai-engine-sa"
  display_name = "AI Engine Service Account"
  project      = google_project.my_project.project_id
}

resource "google_service_account_key" "frontend_key" {
  service_account_id = google_service_account.frontend_service_account.name
}

resource "google_service_account_key" "backend_key" {
  service_account_id = google_service_account.backend_service_account.name
}

resource "google_service_account_key" "ai_engine_key" {
  service_account_id = google_service_account.ai_engine_service_account.name
}

# Cloud Run Services
resource "google_cloud_run_service" "frontend" {
  name     = "frontend"
  project  = google_project.my_project.project_id
  location = var.region
  # Include other necessary configurations for the frontend service
}

resource "google_cloud_run_service" "backend" {
  name     = "backend"
  project  = google_project.my_project.project_id
  location = var.region
  # Include other necessary configurations for the backend service
}

resource "google_cloud_run_service" "ai_engine" {
  name     = "ai-engine"
  project  = google_project.my_project.project_id
  location = var.region
  # Include other necessary configurations for the AI engine service
}

# IAM Bindings
resource "google_project_iam_binding" "frontend_binding" {
  project = google_project.my_project.project_id
  role    = "roles/run.invoker"
  members = ["serviceAccount:${google_service_account.frontend_service_account.email}"]
}

resource "google_project_iam_binding" "backend_binding" {
  project = google_project.my_project.project_id
  role    = "roles/run.invoker"
  members = ["serviceAccount:${google_service_account.backend_service_account.email}"]
}

resource "google_project_iam_binding" "ai_engine_binding" {
  project = google_project.my_project.project_id
  role    = "roles/run.invoker"
  members = ["serviceAccount:${google_service_account.ai_engine_service_account.email}"]
}

# Secret Manager
resource "google_secret_manager_secret" "secret" {
  secret_id = "my-secret"
  replication {
    automatic = true
  }
}

# Model Cache Bucket
resource "google_storage_bucket" "model_cache_bucket" {
  name     = var.model_cache_bucket_name
  location = var.model_cache_bucket_location
  depends_on = [google_project_service.storage_api]
}

# Outputs
output "frontend_url" {
  value = google_cloud_run_service.frontend.status[0].url
}

output "backend_url" {
  value = google_cloud_run_service.backend.status[0].url
}

output "ai_engine_url" {
  value = google_cloud_run_service.ai_engine.status[0].url
}

output "artifact_registry" {
  value = google_artifact_registry_repository.my_repo.id
}

output "deployer_service_account" {
  value = google_service_account.backend_service_account.email
}