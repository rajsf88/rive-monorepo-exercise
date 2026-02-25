variable "environment" {
  description = "Deployment environment"
  type        = string
  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "environment must be development, staging, or production"
  }
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

variable "domain_name" {
  description = "Custom domain for the web editor (production only)"
  type        = string
  default     = "editor.rive.app"
}

variable "artifact_retention_days" {
  description = "Days to retain CI build artifacts in S3"
  type        = number
  default     = 30
}
