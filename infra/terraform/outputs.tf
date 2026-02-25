output "cloudfront_url" {
  description = "CloudFront URL for the web editor"
  value       = "https://${aws_cloudfront_distribution.web_editor.domain_name}"
}

output "artifacts_bucket" {
  description = "S3 bucket name for CI build artifacts"
  value       = aws_s3_bucket.artifacts.bucket
}

output "ecr_repository_url" {
  description = "ECR repository URL for Docker images"
  value       = aws_ecr_repository.web_editor.repository_url
}
