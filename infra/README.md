# NurseAda Infrastructure

This folder contains deployment and ops scaffolding for NurseAda, aligned with the PRD (§2.6).

## Kubernetes & Helm

- `infra/helm/nurseada/` – Helm chart for backend services:
  - Deploys `gateway`, `cdss`, `knowledge`, `xai`, `llm-gateway`, and `fhir-adapter` Deployments and Services
  - Creates an Ingress for the gateway (suitable for Kong, NGINX, or cloud ingress controllers)
  - Wires internal service URLs via environment variables (see `services/gateway/app/config.py`)

Example install command (after building/pushing images and configuring a cluster):

```bash
helm upgrade --install nurseada infra/helm/nurseada \
  --set image.registry="ghcr.io/<org>/" \
  --set gateway.image.repository="nurseada-gateway" \
  --set gateway.image.tag="<tag>"
```

Adjust repositories/tags per your registry.

## CI/CD

- `.github/workflows/backend-ci-cd.yml` – GitHub Actions workflow that:
  - Builds Docker images for each backend service
  - Pushes them to GitHub Container Registry (`ghcr.io`)
  - Runs `helm upgrade --install` against a Kubernetes cluster when pushing to `main`

The workflow expects:

- `KUBECONFIG_CONTENT` secret containing a kubeconfig for the target cluster
- Permissions for GitHub Actions to push to `ghcr.io`

You can extend this to ArgoCD by pointing an Argo `Application` at `infra/helm/nurseada` instead of running Helm directly in CI.

## Observability

- `infra/k8s/prometheus-scrape-example.yaml` – Example `ServiceMonitor` for Prometheus Operator to scrape `/metrics` from all backend services.
  - Update labels/namespace as needed for your Prometheus installation.
  - Python services should expose a Prometheus endpoint (e.g. via `prometheus-fastapi-instrumentator`) at `/metrics`.

For centralized logging:

- Run an ELK or EFK stack (e.g. via Helm charts) and configure Fluent Bit/Fluentd to ship container logs.
- Ensure backend services log in structured JSON so log queries are reliable.

## Secrets

For production, store secrets in a dedicated secrets manager (e.g. AWS Secrets Manager or HashiCorp Vault) and surface them to pods via:

- CSI Secret Store driver, or
- K8s Secrets synced from the external store.

Do not commit `.env` files containing real credentials. Use `.env.example` for documentation only.
