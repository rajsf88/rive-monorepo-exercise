terraform {
  required_version = ">= 1.7.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Remote state — S3 backend for team sharing
  backend "s3" {
    bucket         = "rive-terraform-state"
    key            = "rive-monorepo/terraform.tfstate"
    region         = "us-west-2"
    encrypt        = true
    dynamodb_table = "rive-terraform-locks"
  }
}

provider "aws" {
  region = var.region
  default_tags {
    tags = {
      Project     = "rive-monorepo"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# ─── S3 Bucket: Build Artifacts ───────────────────────────────────────────────
resource "aws_s3_bucket" "artifacts" {
  bucket = "rive-build-artifacts-${var.environment}"
}

resource "aws_s3_bucket_versioning" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id
  rule {
    id     = "expire-nightly-builds"
    status = "Enabled"
    filter { prefix = "nightly/" }
    expiration { days = 30 }
  }
}

# ─── S3 Bucket: Web Editor Static Site ───────────────────────────────────────
resource "aws_s3_bucket" "web_editor" {
  bucket = "rive-web-editor-${var.environment}"
}

resource "aws_s3_bucket_public_access_block" "web_editor" {
  bucket = aws_s3_bucket.web_editor.id
  # Files served via CloudFront, not direct S3 access
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ─── CloudFront: Web Editor CDN ───────────────────────────────────────────────
resource "aws_cloudfront_origin_access_control" "web_editor" {
  name                              = "rive-web-editor-oac-${var.environment}"
  description                       = "OAC for Rive web editor S3 origin"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "web_editor" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  comment             = "Rive Web Editor CDN [${var.environment}]"
  aliases             = var.environment == "production" ? [var.domain_name] : []
  price_class         = "PriceClass_100"

  origin {
    domain_name              = aws_s3_bucket.web_editor.bucket_regional_domain_name
    origin_id                = "s3-web-editor"
    origin_access_control_id = aws_cloudfront_origin_access_control.web_editor.id
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "s3-web-editor"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }

    min_ttl     = 0
    default_ttl = 86400   # 1 day
    max_ttl     = 2592000 # 30 days
  }

  # SPA routing — redirect 404s to index.html
  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  viewer_certificate {
    cloudfront_default_certificate = var.environment != "production"
    minimum_protocol_version       = "TLSv1.2_2021"
  }
}

# ─── ECR: Docker Image Registry ───────────────────────────────────────────────
resource "aws_ecr_repository" "web_editor" {
  name                 = "rive/web-editor"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration { scan_on_push = true }
  encryption_configuration { encryption_type = "AES256" }
}

resource "aws_ecr_lifecycle_policy" "web_editor" {
  repository = aws_ecr_repository.web_editor.name
  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep only last 10 images on non-release tags"
      selection = {
        tagStatus     = "tagged"
        tagPrefixList = ["nightly-", "pr-"]
        countType     = "imageCountMoreThan"
        countNumber   = 10
      }
      action = { type = "expire" }
    }]
  })
}
