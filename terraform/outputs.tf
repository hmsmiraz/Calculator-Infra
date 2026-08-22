output "jenkins_master_ip" { value = google_compute_address.jenkins_master_ip.address }
output "jenkins_agent_ip"  { value = google_compute_address.jenkins_agent_ip.address }
output "gke_cluster_name"  { value = google_container_cluster.calculator_gke.name }