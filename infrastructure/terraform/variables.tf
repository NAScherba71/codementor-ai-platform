# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  📋 Terraform Variables - CodeMentor AI Platform                          ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

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
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

variable "billing_account" {
  description = "GCP Billing Account ID"
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
}

variable "enable_vertex_ai" {
  description = "Enable Vertex AI APIs"
  type        = bool
  default     = true
}
