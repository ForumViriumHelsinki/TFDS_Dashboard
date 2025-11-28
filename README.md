# TFDS Dashboard

Traffic and Floating Data System visualization dashboard.

## Overview

The TFDS Dashboard visualizes floating car data by connecting directly to InfluxDB for time-series data storage and analysis.

### Key Features

- Real-time visualization of floating car data from InfluxDB
- Time-series data storage and querying with InfluxDB
- Error tracking and performance monitoring with Sentry
- Automated CI/CD pipeline with GitHub Actions
- Container-based deployment via ArgoCD

## Quick Start

### Prerequisites

- Node.js 20+
- Docker
- kubectl (for deployment)
- pre-commit (for code quality hooks)

### Local Development

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Copy environment template:**

   ```bash
   cp .env.example .env
   ```

3. **Start development server:**

   ```bash
   npm run dev
   ```

4. **Open http://localhost:3000**

### Docker Development

```bash
# Build container image
docker build -t tfds-dashboard .

# Run container (maps internal port 80 to host port 8080)
docker run -p 8080:80 tfds-dashboard

# Access at http://localhost:8080
```

## Development Documentation

See [TFDS_DASHBOARD_DEVELOPER_GUIDE.md](docs/TFDS_DASHBOARD_DEVELOPER_GUIDE.md) for:

- Detailed development setup
- Environment variables reference
- InfluxDB integration guide
- Sentry configuration
- Deployment procedures
- Testing strategies

## Project Structure

```
tfds-dashboard/
├── src/                      # React app (Vite + TypeScript + Mantine)
│   ├── main.tsx              # App bootstrap (theme, providers, Sentry)
│   ├── App.tsx               # Application shell
│   ├── router.ts             # @tanstack/react-router config
│   ├── components/           # UI modules (map, tabs, layout, data display)
│   ├── hooks/                # Reusable hooks
│   ├── queries/              # Tanstack query option builders
│   ├── services/             # API clients (InfluxDB client)
│   ├── utils/                # Formatting helpers and constants
│   └── App.css, index.css    # Global styles
├── public/                   # Static assets served by Vite
├── tests/                    # Vitest + Testing Library setup and specs
├── docs/                     # Developer and deployment docs
├── nginx/                    # NGINX config used in the container image
├── deploy/                   # Helm values for TFDS deployment
├── k8s/                      # Kubernetes manifests (deployment/service/namespace)
├── .github/workflows/        # CI pipelines (container build, release-please)
├── Dockerfile, skaffold.yaml # Container build + local dev tooling
├── Makefile                  # Helper commands for dev/CI
├── vite.config.js            # Vite bundler config (Sentry plugin, dev proxies)
├── tsconfig.json             # TypeScript compiler options
├── eslint.config.js          # Linting rules shared across app
└── package.json              # Dependencies and npm scripts
```

## Development Pipeline

### Branching

- `main`: Production-ready code
- `feature/*`: New features
- `fix/*`: Bug fixes

### Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add vehicle clustering on map
fix: correct InfluxDB query timeout handling
docs: update API integration guide
```

### Releases

Releases are automated using [release-please](https://github.com/googleapis/release-please):

- Commit messages determine version bumps
- Release PRs are created automatically
- Merging release PR triggers container build
- Container images are pushed to GHCR with semantic version tags

## Deployment

Deployed to Kubernetes via ArgoCD:

- **Production**: https://tfds-dashboard.dataportal.fi
- **Namespace**: `tfds-dashboard`
- **ArgoCD App**: https://argocd.dataportal.fi/applications/tfds-dashboard

## Environment Variables

Required environment variables:

| Variable                         | Description                     | Example                                                     |
| -------------------------------- | ------------------------------- | ----------------------------------------------------------- |
| `VITE_INFLUXDB_URL`              | InfluxDB server URL             | `https://idea-helsinki-influxdb-helm-webapp.dataportal.fi/` |
| `VITE_INFLUXDB_ORG`              | InfluxDB organization           | `idea-helsinki`                                             |
| `VITE_INFLUXDB_BUCKET`           | InfluxDB bucket name            | `idea-fcd-bucket`                                           |
| `VITE_INFLUXDB_TOKEN`            | InfluxDB access token           | (Set in .env for development only)                          |
| `VITE_SENTRY_DSN` (optional)     | Sentry error tracking DSN       | `https://...@sentry.io/...`                                 |
| `SENTRY_AUTH_TOKEN` (build-time) | Sentry auth token (source maps) | (GitHub Secret / CI environment)                            |

See `.env.example` for full list.

**Important**: `VITE_` prefixed variables are embedded into the client bundle at build time and become publicly visible. The InfluxDB token should be read-only and scoped to specific buckets for security.

## Monitoring with Sentry

### Error Tracking and Performance Monitoring

The application includes comprehensive Sentry integration:

- **Error Tracking**: Automatic capture of runtime errors and exceptions
- **Performance Monitoring**: Transaction tracing for API calls and renders
- **Session Replay**: 10% of sessions recorded, 100% of error sessions
- **Source Maps**: Automatically uploaded during production builds
- **Release Tracking**: Each deployment creates a Sentry release

### Sentry Configuration

**Development:**

- Optional - set `VITE_SENTRY_DSN` in `.env` to enable monitoring locally
- Source maps not uploaded in development builds

**Production:**

- Sentry DSN injected via GitHub Secrets (`SENTRY_DSN`)
- Source maps uploaded automatically during Docker build
- Releases created after successful deployments
- Organization: `forumviriumhelsinki`
- Project: `tfds_dashboard`

**Required GitHub Secrets:**

- `SENTRY_DSN`: Public DSN for error reporting (safe to expose client-side)
- `SENTRY_AUTH_TOKEN`: Auth token for source map uploads (keep secret)

## Testing

```bash
# Run tests
npm test

# With coverage
npm run test:coverage

# Run linting
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code
npm run format
```

## Pre-commit Hooks

Automated quality checks run before each commit:

```bash
# Install hooks
pip install pre-commit
pre-commit install --hook-type pre-commit --hook-type commit-msg

# Run manually
pre-commit run --all-files
```

Hooks include:

- Trailing whitespace removal
- EOF fixer
- YAML/JSON validation
- Large file detection
- Merge conflict detection
- Private key detection
- Conventional commit validation
- Prettier formatting
- ESLint checks

## Contributing

1. Create a feature branch
2. Make changes with conventional commits
3. Ensure tests pass
4. Create pull request
5. Address review feedback

## Support

- **Issues**: [GitHub Issues](https://github.com/ForumViriumHelsinki/tfds-dashboard/issues)
- **Documentation**: See `docs/` directory
- **Developer Guide**: [TFDS_DASHBOARD_DEVELOPER_GUIDE.md](docs/TFDS_DASHBOARD_DEVELOPER_GUIDE.md)
