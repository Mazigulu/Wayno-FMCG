terraform {
  required_version = ">= 1.5.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
}

# Cloud SQL PostgreSQL Instance (High Availability)
resource "google_sql_database_instance" "wayno_db" {
  name             = "wayno-postgres-prod"
  database_version = "POSTGRES_16"
  region           = var.gcp_region

  settings {
    tier              = "db-custom-4-16384"
    availability_type = "REGIONAL"
    disk_size         = 100
    disk_type         = "PD_SSD"
    backup_configuration {
      enabled    = true
      start_time = "02:00"
    }
  }
}

# Redis Cluster for Distributed Session & Ephemeral Telemetry
resource "google_redis_instance" "wayno_cache" {
  name           = "wayno-redis-cache"
  memory_size_gb = 5
  region         = var.gcp_region
  redis_version  = "REDIS_7_0"
}
