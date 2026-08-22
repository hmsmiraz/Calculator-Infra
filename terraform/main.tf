terraform {
  required_providers {
    google = { source = "hashicorp/google", version = "~> 5.30" }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

# ── Firewall (VM admin access only — GKE/LB firewall rules are auto-managed by GCP) ──
resource "google_compute_firewall" "admin_ssh_and_ui" {
  name    = "jenkins-admin-access"
  network = "default"
  allow {
    protocol = "tcp"
    ports    = ["22", "8080"]
  }
  source_ranges = [var.admin_ip_cidr]
  target_tags   = ["jenkins-master", "jenkins-agent"]
}

resource "google_compute_firewall" "master_to_agent" {
  name    = "jenkins-master-to-agent"
  network = "default"
  allow {
    protocol = "tcp"
    ports    = ["22"]
  }
  source_tags = ["jenkins-master"]
  target_tags = ["jenkins-agent"]
}

# ── Jenkins Master VM ────────────────────────────────────────────────────
resource "google_compute_address" "jenkins_master_ip" {
  name   = "jenkins-master-ip"
  region = var.region
}

resource "google_compute_instance" "jenkins_master" {
  name         = "jenkins-master-vm"
  machine_type = var.jenkins_master_machine_type
  zone         = var.zone
  tags         = ["jenkins-master"]

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2204-lts"
      size  = var.jenkins_master_disk_gb
      type  = "pd-standard"   # cheapest disk type — fine for Jenkins master (light I/O)
    }
  }
  network_interface {
    network       = "default"
    access_config { nat_ip = google_compute_address.jenkins_master_ip.address }
  }
  service_account {
    email  = var.jenkins_master_sa
    scopes = ["cloud-platform"]
  }
  metadata = {
    ssh-keys = "opsadmin:${var.admin_pubkey}"
  }
}

# ── Jenkins Agent VM — "calculator-app" (Podman builds) ──────────────────
resource "google_compute_address" "jenkins_agent_ip" {
  name   = "jenkins-agent-ip"
  region = var.region
}

resource "google_compute_instance" "jenkins_agent" {
  name         = "calculator-app"
  machine_type = var.jenkins_agent_machine_type
  zone         = var.zone
  tags         = ["jenkins-agent"]

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2204-lts"
      size  = var.jenkins_agent_disk_gb
      type  = "pd-standard"
    }
  }
  network_interface {
    network       = "default"
    access_config { nat_ip = google_compute_address.jenkins_agent_ip.address }
  }
  service_account {
    email  = var.jenkins_agent_sa
    scopes = ["cloud-platform"]
  }
  metadata = {
    ssh-keys = "opsadmin:${var.admin_pubkey}\njenkins:${var.agent_pubkey}"
  }
}

# ── GKE cluster ───────────────────────────────────────────────────────────
resource "google_container_cluster" "calculator_gke" {
  name                     = "calculator-gke"
  location                 = var.zone
  remove_default_node_pool = true
  initial_node_count       = 1
  deletion_protection      = false
}

resource "google_container_node_pool" "calculator_nodes" {
  name       = "calculator-node-pool"
  cluster    = google_container_cluster.calculator_gke.name
  location   = var.zone
  node_count = var.gke_node_count

  node_config {
    machine_type    = var.gke_node_machine_type
    disk_size_gb    = var.gke_node_disk_gb
    disk_type       = "pd-standard"
    preemptible     = var.gke_node_preemptible
    service_account = var.gke_node_sa
    oauth_scopes    = ["https://www.googleapis.com/auth/cloud-platform"]
  }
}