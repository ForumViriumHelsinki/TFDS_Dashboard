# TFDS Dashboard Developer Guide

This guide provides comprehensive documentation for developers implementing the TFDS (Traffic and Floating Data System) Dashboard. The dashboard visualizes floating car data from InfluxDB time-series database.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Development Environment Setup](#development-environment-setup)
- [Development Pipeline](#development-pipeline)
- [Environment Variables](#environment-variables)
- [URLs and Endpoints](#urls-and-endpoints)
- [Integration Points](#integration-points)
- [Deployment](#deployment)
- [Testing](#testing)
- [Contributing](#contributing)

## Overview

The TFDS Dashboard is a web application that:

- Visualizes floating car data in real-time
- Queries time-series data directly from InfluxDB
- Follows Forum Virium Helsinki's GitOps deployment practices

**Tech Stack:**

- Frontend: React/Vue.js (or your chosen framework)
- Backend API: Node.js/Python (if needed)
- Data Storage: InfluxDB
- Container Runtime: Docker
- Deployment: Kubernetes via ArgoCD
- CI/CD: GitHub Actions

## Architecture

```
┌─────────────────┐
│  TFDS Dashboard │
│   (Frontend)    │
└────────┬────────┘
         │
         ▼
┌──────────────┐
│   InfluxDB   │
│ (Time Series)│
└──────────────┘
```

### Components

1. **Frontend Dashboard**: Web application for data visualization
2. **InfluxDB Integration**: Time-series database for storing and querying metrics
3. **Authentication**: OAuth2 Proxy (optional, for production)

## Development Environment Setup

### Prerequisites

- **Node.js**: v20+ (for frontend development)
- **Docker**: Latest stable version
- **kubectl**: For Kubernetes interactions
- **Helm**: v3+ (for local chart testing)
- **Skaffold**: For local development workflow (optional)
- **pre-commit**: For code quality hooks

### Initial Setup

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd tfds-dashboard
   ```

2. **Install dependencies:**

   ```bash
   # For Node.js projects
   npm install

   # For Python projects
   pip install -r requirements.txt
   ```

3. **Set up pre-commit hooks:**

   ```bash
   pip install pre-commit
   pre-commit install --hook-type pre-commit --hook-type commit-msg
   ```

4. **Create local environment configuration:**

   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

5. **Run locally:**

   ```bash
   # Development server
   npm run dev

   # Or with Docker
   docker build -t tfds-dashboard .
   docker run -p 8080:80 tfds-dashboard
   ```

### Local Development with Skaffold

For a Kubernetes-like local environment:

```bash
skaffold dev
```

This will:

- Build your container image
- Deploy to your local Kubernetes cluster (Docker Desktop/OrbStack)
- Watch for file changes and automatically rebuild/redeploy

## Development Pipeline

### Branching Strategy

- **main**: Production-ready code
- **feature/\***: Feature development branches
- **fix/\***: Bug fix branches

### Workflow

1. **Create a feature branch:**

   ```bash
   git checkout -b feature/add-map-visualization
   ```

2. **Make changes and commit using conventional commits:**

   ```bash
   git commit -m "feat: add interactive map visualization"
   git commit -m "fix: correct InfluxDB query timestamp handling"
   ```

3. **Push and create a pull request:**

   ```bash
   git push origin feature/add-map-visualization
   ```

4. **Automated processes:**
   - Pre-commit hooks validate code quality
   - GitHub Actions builds and tests your code
   - Container images are built on push to main
   - Release-Please creates release PRs for version bumps

### CI/CD Pipeline

**On every push:**

- Linting and code quality checks
- Unit and integration tests
- Security scanning

**On push to main:**

- Container image build
- Push to GitHub Container Registry (GHCR)
- Tag with semantic version

**On release tag:**

- Create GitHub release
- Update CHANGELOG.md
- Trigger ArgoCD deployment (via image updater)

### Release Management

This repository uses [release-please](https://github.com/googleapis/release-please) for automated versioning:

- **Commit message format determines version bump:**
  - `fix:` → Patch version (0.1.0 → 0.1.1)
  - `feat:` → Minor version (0.1.0 → 0.2.0)
  - `feat!:` or `BREAKING CHANGE:` → Major version (0.1.0 → 1.0.0)

- Release-Please automatically:
  - Creates a release PR with changelog
  - Updates version numbers
  - Creates GitHub releases
  - Triggers container builds with version tags

## Environment Variables

### Required Environment Variables

| Variable          | Description                   | Example                          | Where to Set          |
| ----------------- | ----------------------------- | -------------------------------- | --------------------- |
| `INFLUXDB_URL`    | InfluxDB server URL           | `https://influxdb.dataportal.fi` | ArgoCD values         |
| `INFLUXDB_TOKEN`  | InfluxDB authentication token | `your-token`                     | Google Secret Manager |
| `INFLUXDB_ORG`    | InfluxDB organization         | `fvh`                            | ArgoCD values         |
| `INFLUXDB_BUCKET` | InfluxDB bucket name          | `tfds-data`                      | ArgoCD values         |

### Optional Environment Variables

| Variable     | Description                              | Default                        | Where to Set                          |
| ------------ | ---------------------------------------- | ------------------------------ | ------------------------------------- |
| `PORT`       | Application server port (see note below) | `3000` (dev), `80` (container) | ArgoCD values                         |
| `LOG_LEVEL`  | Logging verbosity                        | `info`                         | ArgoCD values                         |
| `NODE_ENV`   | Node environment                         | `production`                   | Dockerfile                            |
| `SENTRY_DSN` | Sentry error tracking                    | -                              | GitHub Secrets, Google Secret Manager |

**Note on PORT configuration:**

- **Development server** (Vite): Runs on port `3000` by default
- **Container internal**: NGINX listens on port `80` inside the container
- **Docker port mapping**: Map container port 80 to host port 8080 (e.g., `-p 8080:80`)
- **Production**: Kubernetes Service routes traffic to container port `80`

**Important: Understanding VITE\_ Prefix**

Vite environment variables follow a specific pattern:

- **`VITE_` prefixed variables**: Embedded into the client-side bundle at **build time**. These become public and are visible in the browser's JavaScript. Only use for non-sensitive configuration (API URLs, feature flags, etc.).
- **Non-prefixed variables** (e.g., `NODE_ENV`, `PORT`): Server-side only, never exposed to the client.

⚠️ **Security Warning**: Never put sensitive data (API keys, tokens, database credentials) in `VITE_` prefixed variables as they will be publicly accessible in the browser's source code. For production:

- Sensitive API calls should be proxied through a backend service
- API keys and tokens should only exist server-side
- Use Google Secret Manager for all production secrets
- Consider implementing a backend API layer to protect credentials

### Managing Secrets

**For development:**

- Use `.env` file (never commit this!)
- Copy from `.env.example`

**For production:**

- Secrets stored in **Google Secret Manager**
- Retrieved via **External Secrets Operator** in Kubernetes
- Never hardcode secrets in code or configuration files

**To add a new secret:**

1. Add to Google Secret Manager:

   ```bash
   echo -n "secret-value" | gcloud secrets create tfds-dashboard-api-key --data-file=-
   ```

2. Create ExternalSecret resource (see `argocd/secrets/` for examples)

3. Reference in your application via environment variable or mounted file

## URLs and Endpoints

### Production URLs

| Service            | URL                                    | Purpose               |
| ------------------ | -------------------------------------- | --------------------- |
| **TFDS Dashboard** | `https://tfds-dashboard.dataportal.fi` | Main application      |
| **InfluxDB**       | `https://influxdb.dataportal.fi`       | Time-series database  |
| **ArgoCD**         | `https://argocd.dataportal.fi`         | Deployment management |

### Development URLs

| Service               | URL                     | Purpose                             |
| --------------------- | ----------------------- | ----------------------------------- |
| **Local Development** | `http://localhost:3000` | Development server                  |
| **Local Docker**      | `http://localhost:8080` | Containerized local app             |
| **Staging**           | TBD                     | Staging environment (if configured) |

### API Endpoints

```
GET /api/v1/floating-car-data
  - Retrieves floating car data
  - Query params: ?startTime=<timestamp>&endTime=<timestamp>

GET /api/v1/vehicles
  - Lists available vehicles

GET /api/v1/metrics
  - Retrieves available metrics
```

**InfluxDB queries:**

Use the InfluxDB client library to query time-series data:

```javascript
// Example query
const query = `
  from(bucket: "tfds-data")
    |> range(start: -1h)
    |> filter(fn: (r) => r._measurement == "vehicle_speed")
    |> aggregateWindow(every: 1m, fn: mean)
`;
```

## Integration Points

**Authentication:**

- API uses token-based authentication
- Token stored in Google Secret Manager
- Pass token in `Authorization` header: `Bearer <token>`

**Rate Limiting:**

- Respect API rate limits (check documentation)
- Implement exponential backoff on failures
- Cache responses when appropriate

**Example Integration:**

```javascript
// idea-helsinki-client.js
class IdeaHelsinkiClient {
  constructor(apiUrl, apiKey) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  async getFloatingCarData(startTime, endTime) {
    const response = await fetch(
      `${this.apiUrl}/api/v1/floating-car-data?startTime=${startTime}&endTime=${endTime}`,
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  }
}
```

### InfluxDB Integration

**Client Setup:**

```javascript
// influxdb-client.js
const { InfluxDB } = require("@influxdata/influxdb-client");

const influxDB = new InfluxDB({
  url: process.env.INFLUXDB_URL,
  token: process.env.INFLUXDB_TOKEN,
});

const queryApi = influxDB.getQueryApi(process.env.INFLUXDB_ORG);
```

**Writing Data:**

```javascript
const { Point } = require("@influxdata/influxdb-client");

const writeApi = influxDB.getWriteApi(
  process.env.INFLUXDB_ORG,
  process.env.INFLUXDB_BUCKET,
);

const point = new Point("vehicle_speed")
  .tag("vehicle_id", "vehicle-123")
  .floatField("speed", 45.5)
  .timestamp(new Date());

writeApi.writePoint(point);
await writeApi.close();
```

**Querying Data:**

```javascript
async function getVehicleSpeeds(vehicleId, startTime) {
  const query = `
    from(bucket: "${process.env.INFLUXDB_BUCKET}")
      |> range(start: ${startTime})
      |> filter(fn: (r) => r._measurement == "vehicle_speed")
      |> filter(fn: (r) => r.vehicle_id == "${vehicleId}")
  `;

  const data = [];
  await queryApi.collectRows(query, (row, tableMeta) => {
    const o = tableMeta.toObject(row);
    data.push(o);
  });

  return data;
}
```

## Deployment

### Container Image

**Building the image:**

```bash
docker build -t ghcr.io/forumviriumhelsinki/tfds-dashboard:latest .
```

**The Dockerfile should:**

- Use multi-stage builds for smaller images
- Run as non-root user
- Include health checks
- Optimize layer caching

**Example Dockerfile structure:**

```dockerfile
# Build stage
FROM node:23-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1
```

### Kubernetes Deployment

**Deployment is managed by ArgoCD** using the `helm-webapp` chart.

**ArgoCD Application location:**

- Configuration: `argocd/apps/templates/tfds-dashboard.yaml`
- Auto-syncs from main branch
- Image tags updated automatically by ArgoCD Image Updater

**Resource requirements:**

- CPU: 100m request, 500m limit
- Memory: 128Mi request, 512Mi limit
- Adjust based on actual usage

**Scaling:**

- Manual scaling: Edit `replicaCount` in ArgoCD application
- Auto-scaling: Configure HPA (Horizontal Pod Autoscaler)
- KEDA: For advanced autoscaling (time-based, metric-based)

### Helm Chart

The application uses the shared `helm-webapp` chart:

```yaml
# In argocd/apps/templates/tfds-dashboard.yaml
source:
  chart: helm-webapp
  repoURL: ghcr.io/forumviriumhelsinki
  targetRevision: 0.11.0 # Use latest stable version
  helm:
    valuesObject:
      image:
        repository: ghcr.io/forumviriumhelsinki/tfds-dashboard
        tag: latest
      ingress:
        enabled: true
        hosts:
          - host: tfds-dashboard.dataportal.fi
            paths:
              - path: /
                pathType: Prefix
      resources:
        requests:
          cpu: 100m
          memory: 128Mi
        limits:
          cpu: 500m
          memory: 512Mi
```

### Monitoring Deployment

**Check ArgoCD status:**

```bash
# View application status
argocd app get tfds-dashboard

# View application logs
argocd app logs tfds-dashboard --follow
```

**Check Kubernetes status:**

```bash
# Get pods
kubectl get pods -n tfds-dashboard

# View pod logs
kubectl logs -n tfds-dashboard deployment/tfds-dashboard --follow

# Describe deployment
kubectl describe deployment -n tfds-dashboard tfds-dashboard
```

## Testing

### Local Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run with coverage
npm run test:coverage
```

### Pre-commit Hooks

Automated checks run before each commit:

- Code linting (ESLint, Prettier)
- Type checking (TypeScript)
- Commit message format validation
- Test suite (if configured)

**To run manually:**

```bash
pre-commit run --all-files
```

### Testing with Docker

```bash
# Build image
docker build -t tfds-dashboard:test .

# Run container
docker run -p 8080:80 --env-file .env.test tfds-dashboard:test

# Run tests in container
docker run tfds-dashboard:test npm test
```

### Integration Testing

Test integration with InfluxDB:

## Contributing

### Code Style

- Follow existing code conventions
- Use ESLint/Prettier for JavaScript/TypeScript
- Use Black/Flake8 for Python
- Write meaningful commit messages (Conventional Commits)
- Add comments for complex logic

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**

```
feat(map): add vehicle clustering on zoom out

Implements clustering algorithm to group nearby vehicles
when map zoom level is below threshold.

Closes #123
```

```
fix(influxdb): handle connection timeout gracefully

Adds retry logic with exponential backoff for InfluxDB
queries that timeout.
```

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with clear commit messages
3. Ensure all tests pass
4. Update documentation if needed
5. Create a pull request with:
   - Clear description of changes
   - Link to related issues
   - Screenshots (if UI changes)
   - Testing notes
6. Address review feedback
7. Squash commits if requested
8. Merge after approval

### Code Review Guidelines

**For reviewers:**

- Check code quality and style
- Verify tests are adequate
- Consider security implications
- Validate documentation updates
- Test functionality if possible

**For authors:**

- Respond to all comments
- Ask for clarification if needed
- Make requested changes promptly
- Keep PRs focused and reasonably sized

## Additional Resources

### Documentation

- [Infrastructure Repository Wiki](https://github.com/ForumViriumHelsinki/infrastructure/wiki)
- [Helm Chart Creation Guide](./HELM_CHART_CREATION.md)
- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [GitHub Actions Workflows](../.github/workflows/)

### Tools

- [Pre-commit hooks](.pre-commit-config.yaml)
- [Release-Please configuration](../release-please-config.json)
- [Cookiecutter templates](../cookiecutter/)

### Support

- **Issues**: Create an issue in the repository
- **Questions**: Contact the platform team
- **Security**: Report security issues privately to the maintainers

## Troubleshooting

### Common Issues

**Docker build fails:**

- Check Dockerfile syntax
- Ensure all dependencies are specified
- Verify base image is accessible

**ArgoCD sync fails:**

- Check application logs: `argocd app logs tfds-dashboard`
- Verify Helm values are valid
- Ensure secrets exist in namespace
- Check resource quotas

**Application won't start:**

- Check pod logs: `kubectl logs -n tfds-dashboard <pod-name>`
- Verify environment variables are set
- Ensure secrets are mounted correctly
- Check health check endpoints

**API integration issues:**

- Verify API credentials are correct
- Check network connectivity
- Review rate limiting
- Enable debug logging

### Getting Help

If you encounter issues not covered here:

1. Check existing issues in the repository
2. Review ArgoCD and Kubernetes logs
3. Consult the infrastructure wiki
4. Reach out to the platform team
5. Create a detailed issue with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Relevant logs and error messages
   - Environment details

---

**Last Updated**: 2025-10-07
**Maintained by**: Forum Virium Helsinki Platform Team
