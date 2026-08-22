variable "project_id" {
  type = string
}

variable "region" {
  type    = string
  default = "asia-southeast1"
}

variable "zone" {
  type    = string
  default = "asia-southeast1-a"
}

variable "admin_ip_cidr" {
  type = string
}

variable "admin_pubkey" {
  type = string
}

variable "agent_pubkey" {
  type = string
}

variable "jenkins_master_sa" {
  type = string
}

variable "jenkins_agent_sa" {
  type = string
}

variable "gke_node_sa" {
  type = string
}

variable "jenkins_master_machine_type" {
  type    = string
  default = "e2-small"
}

variable "jenkins_master_disk_gb" {
  type    = number
  default = 20
}

variable "jenkins_agent_machine_type" {
  type    = string
  default = "e2-medium"
}

variable "jenkins_agent_disk_gb" {
  type    = number
  default = 30
}

variable "gke_node_machine_type" {
  type    = string
  default = "e2-medium"
}

variable "gke_node_count" {
  type    = number
  default = 1
}

variable "gke_node_disk_gb" {
  type    = number
  default = 30
}

variable "gke_node_preemptible" {
  type    = bool
  default = true
}