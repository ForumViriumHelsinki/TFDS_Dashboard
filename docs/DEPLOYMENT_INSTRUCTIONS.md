# Deployment Instructions for TFDS Dashboard

This guide describes how to deploy the TFDS Dashboard as a Docker container, either locally or to a Kubernetes cluster.

---

## 1. Prerequisites

- **Docker** (latest stable)
- **kubectl** (for Kubernetes deployment)

---

## 2. Environment Variables

The dashboard requires several environment variables, which are injected at build time. In CI/CD pipelines, secrets should be managed securely using e.g. Github secrets.

**Key variables:**

| Variable                | Description                                    | Example                                                    |
|-------------------------|------------------------------------------------|------------------------------------------------------------|
| VITE_INFLUXDB_URL       | InfluxDB server URL                            | https://idea-helsinki-influxdb-helm-webapp.dataportal.fi/  |
| VITE_INFLUXDB_ORG       | InfluxDB organization                          | idea-helsinki                                              |
| VITE_INFLUXDB_BUCKET    | InfluxDB bucket name                           | idea-fcd-bucket                                            |
| VITE_INFLUXDB_TOKEN     | InfluxDB access token (read-only)              | ********                                                   |
| VITE_APP_VERSION        | App version (optional)                         | 1.2.3                                                      |
| VITE_SENTRY_DSN         | Sentry DSN (optional)                          | https://...@sentry.io/...                                  |
| SENTRY_AUTH_TOKEN       | Sentry auth token (optional, build-time only)  | (secret, for source maps)                                  |

- All `VITE_` variables are embedded at build time and are public in the client bundle.
- Never expose sensitive tokens in `VITE_` variables for production; use read-only, scoped tokens.

---

## 3. Building the Docker Image

You can build the Docker image locally or rely on CI/CD to build and push to some container registry, like GHCR.

### Local Build

```bash
docker build \
  --build-arg VITE_INFLUXDB_URL=<influxdb-url> \
  --build-arg VITE_INFLUXDB_ORG=<influxdb-org> \
  --build-arg VITE_INFLUXDB_BUCKET=<influxdb-bucket> \
  --build-arg VITE_INFLUXDB_TOKEN=<influxdb-token> \
  --build-arg VITE_APP_VERSION=<app-version> \
  --build-arg VITE_SENTRY_DSN=<sentry-dsn> \
  --build-arg SENTRY_AUTH_TOKEN=<sentry-auth-token> \
  -t tfds-dashboard:latest .
```

### CI/CD Build
- check example workflow for building new container image and pushing it to GHCR [here](../.github/workflows/container-build.yaml)

---

## 4. Running the Container Locally

```bash
docker run -p 8080:80 tfds-dashboard:latest
```
- The app will be available at http://localhost:8080
- NGINX serves the static frontend on port 80 inside the container
- Health endpoint: http://localhost:8080/health

---

## 5. Deploying to Kubernetes

### 5.1. Build and Push Image (if not using CI/CD)

```bash
docker build -t ghcr.io/forumviriumhelsinki/tfds-dashboard:<tag> .
docker push ghcr.io/forumviriumhelsinki/tfds-dashboard:<tag>
```

### 5.2. Update Kubernetes Deployment

- Edit the image tag in your deployment manifest (see `k8s/deployment.yaml`):

```yaml
containers:
  - name: tfds-dashboard
    image: ghcr.io/forumviriumhelsinki/tfds-dashboard:<tag>
    ports:
      - containerPort: 80
```

- Apply the deployment:

```bash
kubectl apply -f k8s/deployment.yaml
```

- Check pod status:

```bash
kubectl get pods -n tfds-dashboard
kubectl logs -n tfds-dashboard deployment/tfds-dashboard --follow
```

---

## 7. NGINX Configuration

- The container uses a custom NGINX config (`nginx/default.conf.template`) for SPA routing, static asset caching, and health checks.
- Health endpoint: `/health` returns 200 OK for readiness/liveness probes.
- Reverse proxies for `/hsy-wfs/` and `/hel-wfs/` are set up to avoid CORS issues.

---

## 8. Health Checks

- The container exposes `/health` for Kubernetes liveness/readiness probes.
- Example probe in `k8s/deployment.yaml`:

```yaml
readinessProbe:
  httpGet:
    path: /health
    port: 80
livenessProbe:
  httpGet:
    path: /health
    port: 80
```

---

## 9. Troubleshooting

- Check container logs: `docker logs <container-id>` or `kubectl logs ...`
- Ensure all required environment variables are set

---

## 10. References

- [README.md](../README.md)
- [Developer Guide](./TFDS_DASHBOARD_DEVELOPER_GUIDE.md)
- [Dockerfile](../Dockerfile)
- [Kubernetes manifests](../k8s/)
- [NGINX config](../nginx/default.conf.template)