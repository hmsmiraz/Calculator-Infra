# Calculator — Jenkins + Podman + GKE + ArgoCD CI/CD

A microservices calculator app deployed on Google Kubernetes Engine via a full self-hosted CI/CD pipeline: **Jenkins** (running on a GCE VM, building with **Podman**) pushes images to **Artifact Registry**, bumps a **GitOps** manifest, and **ArgoCD** auto-syncs the change into **GKE**, fronted by **nginx-ingress** behind a **Google Cloud Load Balancer**.

Everything — app source, infrastructure code, and CI/CD config — lives in this single repo.

## Live app

- **Frontend / API**: `http://<LOAD_BALANCER_IP>/` — get the current value with `kubectl get svc -n ingress-nginx ingress-nginx-controller`
- **Jenkins**: reachable only via IAP tunnel (see below) — `http://localhost:8888` once tunneled
- **ArgoCD**: reachable only via `kubectl port-forward` (see below)

---

## Architecture

```
GitHub push (this repo, main)
      │
      ▼
Jenkins (jenkins-master-vm)
  │  triggers pipeline on calculator-cicd job
  ▼
Jenkins Agent "calculator-app" (Podman build agent, connected via SSH)
  │  auths to GCP using the VM's own attached service account
  │  (no static keys — gcloud auth print-access-token → podman login)
  ▼
podman build + push × 5 services  ──────►  Artifact Registry
  │
  ▼
kustomize edit set image (bump all 5 tags in k8s/gitops/kustomization.yaml)
  │
  ▼
git commit + push (back to this repo, main)
      │
      ▼
ArgoCD (running inside GKE, auto-sync + self-heal)
  │  watches k8s/gitops/ on this repo
  ▼
GKE cluster "calculator-gke" (single Spot e2-medium node)
  ├── postgres (PVC-backed)
  ├── redis
  ├── auth-service, calculator-service, user-service, api-gateway, frontend
  └── ingress-nginx (Deployment, Service type=LoadBalancer)
              │
              ▼
   GCP Network Load Balancer ──► http://<LOAD_BALANCER_IP>/
```

**Why this shape:**
- Jenkins = CI only. It never touches the cluster directly.
- ArgoCD = CD only. It's the only thing that ever runs `kubectl apply` against the app namespace.
- The Jenkins agent VM authenticates to GCP via its own attached service account identity, not a downloadable key — GCP org policy disallows service-account key creation on this project anyway, so this was the only viable path (and is the better practice regardless).
- Nginx does the actual path-based routing (`/api/*` → `api-gateway`, `/*` → `frontend`); the GCP Load Balancer just forwards TCP to nginx.

---

## Repository layout

```
.
├── api-gateway/            Node/Express — routes to the 3 backend services, JWT auth, rate limiting
├── auth-service/           Node/Express — register/login, issues JWTs
├── calculator-service/     Node/Express — calculation logic + history
├── user-service/           Node/Express — user stats
├── frontend/               Next.js 16 (standalone build)
├── docker-compose.yml      Original local-dev compose file (not used in the GKE deploy)
├── init.sql                Postgres schema (users, calculations) — applied manually to the DB
│
├── terraform/              Provisions: 2 GCE VMs (Jenkins master + Podman agent) + GKE cluster/node pool
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
│
├── ansible/                Configures the two VMs after Terraform creates them
│   ├── inventory.ini
│   ├── jenkins-master.yml  Installs Jenkins, Java 21, kubectl, gcloud SDK
│   └── jenkins-agent.yml   Installs Podman, Java 21, kustomize, gcloud SDK; creates the `jenkins` SSH user
│
├── k8s/gitops/             What ArgoCD actually deploys — the single source of truth for the running app
│   ├── kustomization.yaml  Image tags — this is the file Jenkins bumps on every build
│   ├── 00-postgres-redis.yaml
│   ├── 10-services.yaml
│   └── 20-ingress.yaml
│
└── Jenkinsfile             The pipeline: checkout → auth → build+push 5 images → bump manifest → commit+push
```

---

## Infrastructure

| Component | What | Sizing | Notes |
|---|---|---|---|
| `jenkins-master-vm` | GCE VM, Ubuntu 22.04 | e2-small, 20GB pd-standard | Runs Jenkins (Java 21) |
| `calculator-app` | GCE VM, Ubuntu 22.04 | e2-medium, 30GB pd-standard | Podman build agent, SSH-launched by Jenkins master |
| `calculator-gke` | GKE cluster | 1× e2-medium node, **Spot pricing** | Zonal, `asia-southeast1-a` |
| Load Balancer | GCP Network LB | — | Fronts `ingress-nginx`, the only public entry point to the app |
| Artifact Registry | `calculator-repo` | — | Docker images for all 5 services |
| Secret Manager | 3 secrets | — | `calculator-db-password`, `calculator-jwt-secret`, `calculator-redis-password` |

Provisioning is fully parameterized in `terraform/variables.tf` — machine types, disk sizes, node count, and Spot/on-demand are all variables with cost-conscious defaults, sized to stretch a GCP free-trial credit.

---

## One-time setup (already done, documented for reference)

1. **GCP project setup** (Cloud Shell/control machine): enabled APIs, created Artifact Registry repo, 3 service accounts (`gke-node-sa`, `jenkins-agent-sa`, `jenkins-master-sa`) with least-privilege IAM roles, 3 Secret Manager secrets, SSH keypairs.
2. **Terraform apply**: provisioned both VMs + the GKE cluster + firewall rules (SSH/8080 restricted to admin IP; a separate rule allows Google's IAP relay range `35.235.240.0/20`).
3. **Ansible**: configured both VMs (Jenkins + Java 21 on the master; Podman + Java 21 + kustomize + the `jenkins` SSH user on the agent).
4. **Jenkins UI setup**: suggested plugins, admin user, credentials (`github-pat`, `jenkins-agent-ssh`), the `podman-builder` SSH node, and the `calculator-cicd` pipeline job pointing at this repo.
5. **GKE + ArgoCD**: created the `calculator` namespace + secrets, installed `ingress-nginx` via Helm (Service type=LoadBalancer), installed ArgoCD (`--server-side` apply — the `applicationsets.argoproj.io` CRD is too large for a normal `kubectl apply`), created the `calculator` ArgoCD `Application` pointing at `k8s/gitops` on `main`.

---

## Day-to-day: how to reach things

**Both Jenkins and ArgoCD are intentionally not exposed on the public internet** — Jenkins because there's no need to widen its firewall, ArgoCD because it's admin-only. Both go through tunnels instead.

**Jenkins:**
```bash
gcloud compute start-iap-tunnel jenkins-master-vm 8080 --local-host-port=localhost:8888 --zone=asia-southeast1-a
```
then browse `http://localhost:8888`. (Port 8888, not 8080 — this network has a routing quirk reaching this VM's public IP directly, and 8080 also collides with ArgoCD's port-forward if both are open at once.)

**ArgoCD:**
```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
```
then browse `https://localhost:8080` (self-signed cert warning is expected). Get the admin password:
```bash
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d; echo
```

**Force an immediate ArgoCD sync** instead of waiting for its ~3 min poll:
```bash
kubectl -n argocd annotate application calculator argocd.argoproj.io/refresh=hard --overwrite
```

**The app itself** is just `http://<LOAD_BALANCER_IP>/` — no tunnel needed, it's genuinely public via the Load Balancer.

---

## Real bugs fixed along the way

This wasn't just following steps — the deploy surfaced (and this repo now fixes) several genuine issues:

- **Ubuntu's built-in `admin` group** collided with the SSH-key-based user-creation mechanism, silently preventing the `admin` login user from ever being created. Renamed to `opsadmin`.
- **Jenkins' APT signing key rotated** (Dec 2025/Jan 2026) — `jenkins.io-2023.key` was stale; switched to `jenkins.io-2026.key`.
- **Jenkins now requires Java 21+**, not 17 — Ansible installs Java 21 and sets it as the default `java` alternative.
- **`podman login` rejects a `https://` scheme prefix** on the registry argument — a syntax quirk, not a credentials problem.
- **Missing `cors` dependency** in `auth-service`, `calculator-service`, `user-service` `package.json` — present in `api-gateway` but never added to the other three.
- **`NEXT_PUBLIC_API_URL` is a Next.js build-time variable**, not a runtime one — setting it as a Kubernetes env var did nothing; it has to be a Docker `ARG`/`ENV` baked in during `npm run build`.
- **`process.env.X || fallback` treats an intentional empty string as unset** — changed to `??` (nullish coalescing) in the frontend's API base URL logic, since `""` is a legitimate "use relative paths" value that `||` was silently overriding.
- **Postgres schema was never initialized** — `init.sql` was designed for `docker-entrypoint-initdb.d/` in the original `docker-compose.yml`, which the Kubernetes Postgres Deployment doesn't replicate. Applied manually via `kubectl exec ... psql < init.sql`.
- **`REDIS_PORT` was missing** on `api-gateway`, `calculator-service`, and `user-service` (only `REDIS_HOST` was set) — caused `Port should be >= 0 and < 65536. Received type number (NaN)`. This silently broke `api-gateway`'s Redis-backed token-blacklist check inside its JWT auth middleware, which shared a `try/catch` with the actual `jwt.verify()` call — so a Redis connection failure was being misreported as `"Invalid token."`, sending debugging in the wrong direction until the middleware source was actually read.

---

## Cost notes

Current sizing (1 Spot GKE node, `e2-small`/`e2-medium` VMs, `pd-standard` disks) runs roughly **$65–70/month** if left online continuously. To pause billing without losing config:
```bash
gcloud compute instances stop jenkins-master-vm calculator-app --zone=asia-southeast1-a
gcloud container clusters resize calculator-gke --node-pool calculator-node-pool --num-nodes=0 --zone=asia-southeast1-a --quiet
```
Resume with `instances start` and `resize --num-nodes=1`.

---

## Teardown

```bash
kubectl delete application calculator -n argocd
kubectl delete namespace calculator argocd
helm uninstall ingress-nginx -n ingress-nginx   # do this before terraform destroy, or the LB can be orphaned
kubectl delete namespace ingress-nginx

cd terraform
terraform destroy -var="project_id=<PROJECT_ID>" \
  -var="admin_ip_cidr=$(curl -s ifconfig.me)/32" \
  -var="admin_pubkey=$(cat ../admin-key.pub)" \
  -var="agent_pubkey=$(cat ../jenkins-agent-key.pub)" \
  -var="jenkins_master_sa=jenkins-master-sa@<PROJECT_ID>.iam.gserviceaccount.com" \
  -var="jenkins_agent_sa=jenkins-agent-sa@<PROJECT_ID>.iam.gserviceaccount.com" \
  -var="gke_node_sa=gke-node-sa@<PROJECT_ID>.iam.gserviceaccount.com"
```