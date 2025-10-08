# Changelog

## [0.1.0] - 2025-01-08

### Added

- Initial scaffolding of TFDS Dashboard repository
- React 18 + Vite application with placeholder UI
- Docker multi-stage build configuration
- NGINX production server setup
- GitHub Actions CI/CD pipeline (container builds, release automation)
- Sentry integration for error tracking and performance monitoring
  - Automatic source map uploads during builds
  - Error boundary with fallback UI
  - Session replay and performance tracing
  - Release tracking
- Pre-commit hooks for code quality
- Automated versioning with release-please
- Comprehensive documentation (README, Developer Guide, CLAUDE.md)
- Testing infrastructure with Vitest
- ESLint and Prettier configuration
- Environment variable templates
- Skaffold configuration for local Kubernetes development
- Health check endpoint for container monitoring
