# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TFDS Dashboard is a web application for visualizing floating car data with time-series data stored in InfluxDB. This follows Forum Virium Helsinki's GitOps deployment patterns via ArgoCD.

**Tech Stack**: React 18 + Vite, Docker (multi-stage: Node.js build → NGINX), Kubernetes, GitHub Actions

## Development Commands

```bash
# Development server (runs on port 3000)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format

# Pre-commit checks (manual)
pre-commit run --all-files
```

## Updating Dependencies

Always update dependencies using Docker to ensure cross-platform compatibility. This prevents build failures from missing platform-specific optional dependencies (e.g., `@rollup/rollup-linux-x64-musl`).

```bash
# Recommended: use Makefile target
make deps-update

# Or manually:
rm -rf node_modules package-lock.json
docker run --rm --platform=linux/amd64 -v "$(pwd)":/app -w /app node:22-alpine npm install
```

**Why?** npm's optional dependencies are platform-specific. Running `npm install` on macOS may not include Linux binaries needed for multi-platform Docker builds.

## Docker Development

```bash
# Build container image
docker build -t tfds-dashboard .

# Run container (maps internal port 80 to host port 8080)
docker run -p 8080:80 tfds-dashboard

# Build with specific version
docker build --build-arg VITE_APP_VERSION=1.0.0 -t tfds-dashboard:1.0.0 .

# Test health endpoint
curl http://localhost:8080/health
```

## Architecture

### Multi-Stage Container Build

- **Build stage**: Node.js 22 Alpine (LTS) compiles React app with Vite, embeds `VITE_` environment variables at build time
- **Production stage**: NGINX 1.27 Alpine serves static files from `/usr/share/nginx/html`
- **Port configuration**: Container listens on port 80 internally; mapped to host port 8080 in development

### Environment Variables Strategy

- **`VITE_` prefixed variables**: Embedded into client bundle at build time, publicly visible in browser (use only for non-sensitive config like API URLs, feature flags)
- **Non-prefixed variables**: Server-side only (e.g., `NODE_ENV`, `PORT`)
- **Production secrets**: Stored in Google Secret Manager, injected via External Secrets Operator in Kubernetes

⚠️ **Critical**: Never put API keys, tokens, or credentials in `VITE_` variables. For production, proxy sensitive API calls through a backend service.

### Integration Points

**InfluxDB**

- URL: `https://idea-helsinki-influxdb-helm-webapp.dataportal.fi/`
- Organization: `idea-helsinki`
- Bucket: `idea-fcd-bucket`
- Client: `@influxdata/influxdb-client`
- Query language: Flux
- Pattern: Use `getQueryApi()` for reads, `getWriteApi()` for writes
- See developer guide section "InfluxDB Integration" for code examples

**Sentry (Error Tracking & Performance Monitoring)**

- Organization: `forum-virium-helsinki`
- Project: `tfds_dashboard`
- DSN: Provided via `VITE_SENTRY_DSN` environment variable
- Initialization: Configured in `src/main.jsx` with ErrorBoundary, performance tracing, and session replay
- Source Maps: Automatically uploaded during production builds via `@sentry/vite-plugin`
- Releases: Created automatically after successful deployments
- Auth Token: Required for source map uploads (stored in `SENTRY_AUTH_TOKEN`, never in `VITE_` variables)

## Deployment Pipeline

### Branching & Commits

- **main**: Production-ready code, triggers ArgoCD deployment
- **feature/\***: New features
- **fix/\***: Bug fixes

**Commit format** (Conventional Commits):

- `feat:` → Minor version bump (0.1.0 → 0.2.0)
- `fix:` → Patch version bump (0.1.0 → 0.1.1)
- `feat!:` or `BREAKING CHANGE:` → Major version bump (0.1.0 → 1.0.0)

### Automated Release Process

1. Push to main with conventional commit
2. Release-please creates/updates release PR with changelog
3. Merge release PR → GitHub Actions builds container image
4. Image tagged with semantic version, pushed to GHCR
5. ArgoCD Image Updater detects new version, triggers deployment

### Production Deployment

- **URL**: https://tfds-dashboard.dataportal.fi
- **ArgoCD App**: https://argocd.dataportal.fi/applications/tfds-dashboard
- **Namespace**: `tfds-dashboard`
- **Helm Chart**: Uses shared `helm-webapp` chart (ghcr.io/forumviriumhelsinki/helm-webapp)

Monitor deployment:

```bash
# ArgoCD status
argocd app get tfds-dashboard
argocd app logs tfds-dashboard --follow

# Kubernetes status
kubectl get pods -n tfds-dashboard
kubectl logs -n tfds-dashboard deployment/tfds-dashboard --follow
kubectl describe deployment -n tfds-dashboard tfds-dashboard
```

## Local Kubernetes Development

Using Skaffold for local K8s development:

```bash
# Start development loop (builds, deploys, watches for changes)
skaffold dev

# Port forwarding to service automatically configured on localhost:8080
```

## Testing Strategy

- **Unit tests**: Vitest with React Testing Library
- **Test setup**: `tests/setup.js` configures jsdom and jest-dom matchers
- **Coverage provider**: v8
- **Integration tests**: Test InfluxDB client functionality

Run specific test file:

```bash
npm test -- tests/App.test.jsx
```

## Key Configuration Files

- **`Makefile`**: Common development tasks including cross-platform dependency updates
- **`package.json`**: Dependencies, scripts, version (updated by release-please)
- **`vite.config.js`**: Vite build configuration with Sentry plugin for source map uploads
- **`Dockerfile`**: Multi-stage build definition with Sentry build args
- **`nginx/default.conf.template`**: NGINX config with health check endpoint, SPA routing, security headers
- **`.pre-commit-config.yaml`**: ESLint, Prettier, conventional commit validation
- **`release-please-config.json`**: Versioning strategy, changelog sections
- **`.release-please-manifest.json`**: Current version tracking
- **`skaffold.yaml`**: Local Kubernetes development workflow
- **`.sentryclirc.example`**: Template for local Sentry CLI configuration (copy to `.sentryclirc`)

## Security & Secrets Management

**Development**:

- Copy `.env.example` to `.env` (never commit `.env`)
- Local API keys for testing only

**Production**:

1. Store secrets in Google Secret Manager:
   ```bash
   echo -n "secret-value" | gcloud secrets create tfds-dashboard-api-key --data-file=-
   ```
2. Create ExternalSecret resource (see ArgoCD application values)
3. Reference via environment variable in pods

## Required Environment Variables

| Variable                         | Purpose                           | Value                                                       |
| -------------------------------- | --------------------------------- | ----------------------------------------------------------- |
| `VITE_INFLUXDB_URL`              | InfluxDB server URL               | `https://idea-helsinki-influxdb-helm-webapp.dataportal.fi/` |
| `VITE_INFLUXDB_ORG`              | InfluxDB organization             | `idea-helsinki`                                             |
| `VITE_INFLUXDB_BUCKET`           | InfluxDB bucket name              | `idea-fcd-bucket`                                           |
| `VITE_INFLUXDB_TOKEN`            | InfluxDB access token             | Set in .env for development (read-only token)               |
| `VITE_SENTRY_DSN` (optional)     | Sentry error tracking DSN         | Set via GitHub Secrets / ArgoCD                             |
| `SENTRY_AUTH_TOKEN` (build-time) | Sentry auth token for source maps | GitHub Secret only, never in code                           |

**Note**: `VITE_SENTRY_DSN` is safe to expose publicly (designed for client-side use), but keep it in secrets for better security posture. The InfluxDB token should be read-only and scoped to specific buckets for security.

## Troubleshooting

**Build fails**: Verify Node.js 20+, clear `node_modules/` and reinstall

**Container won't start**: Check `docker logs <container-id>`, verify health check endpoint responds at `/health`

**ArgoCD sync fails**: Check `argocd app logs tfds-dashboard`, verify Helm values are valid, ensure secrets exist in namespace

**InfluxDB connection issues**: Verify token in `.env`, check network connectivity to InfluxDB server, ensure token has read permissions for the bucket

**Sentry not reporting errors**: Verify `VITE_SENTRY_DSN` is set in `.env`, check browser console for Sentry initialization, ensure errors are thrown (not just logged)

**Source maps not uploading**: Verify `SENTRY_AUTH_TOKEN` is set during build, check vite.config.js Sentry plugin configuration, review build logs for upload errors

## References

- [Developer Guide](docs/TFDS_DASHBOARD_DEVELOPER_GUIDE.md): Comprehensive development documentation
- [Infrastructure Wiki](https://github.com/ForumViriumHelsinki/infrastructure/wiki): Platform documentation
