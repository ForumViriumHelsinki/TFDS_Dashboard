# Changelog

## [0.2.0](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/compare/tfds-dashboard-v0.1.0...tfds-dashboard-v0.2.0) (2025-10-16)


### Features

* initial TFDS Dashboard React application setup ([#1](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/1)) ([5034528](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/5034528b2c195dcfd67ae6646195efbcb54db1d8))


### Bug Fixes

* correct GitHub Actions secret reference in workflow conditional ([#5](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/5)) ([b33a8fa](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/b33a8fa7d2d1f9d35135a4699b5b8ae4e25780b4))
* correct Sentry organization name to match auth token ([#7](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/7)) ([d758549](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/d7585495b830b210ef1219ddba52d17662654bb8))
* replace Sentry Docker action with CLI for ARC runner compatibility ([#11](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/11)) ([00ddda5](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/00ddda512b6d520c65e70505f8e5e6c9c6d8dc2a))

## [0.2.0](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/compare/tfds-dashboard-v0.1.0...tfds-dashboard-v0.2.0) (2025-10-14)

### Features

- initial TFDS Dashboard React application setup ([#1](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/1)) ([5034528](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/5034528b2c195dcfd67ae6646195efbcb54db1d8))

### Bug Fixes

- correct GitHub Actions secret reference in workflow conditional ([#5](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/5)) ([b33a8fa](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/b33a8fa7d2d1f9d35135a4699b5b8ae4e25780b4))

## [0.2.0](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/compare/tfds-dashboard-v0.1.0...tfds-dashboard-v0.2.0) (2025-10-13)

### Features

- initial TFDS Dashboard React application setup ([#1](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/1)) ([5034528](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/5034528b2c195dcfd67ae6646195efbcb54db1d8))

## [0.2.0](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/compare/tfds-dashboard-v0.1.0...tfds-dashboard-v0.2.0) (2025-10-09)

### Features

- initial TFDS Dashboard React application setup ([#1](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/1)) ([5034528](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/5034528b2c195dcfd67ae6646195efbcb54db1d8))

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
