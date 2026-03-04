# Changelog

## [0.7.7](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/compare/tfds-dashboard-v0.7.6...tfds-dashboard-v0.7.7) (2026-03-04)


### Bug Fixes

* compact header layout to prevent sign-in button overflow ([#112](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/112)) ([c9a5831](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/c9a5831857e623ee3884c499e66d36d2eb4713b4))
* **deps:** update dependency @react-oauth/google to ^0.13.0 ([#110](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/110)) ([69019c5](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/69019c59b14f894a80fa3c24bf8a475320d9b2bb))
* **deps:** update dependency lucide-react to ^0.577.0 ([#111](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/111)) ([ab311a7](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/ab311a724684a0e6f9e591d4ac6cc136a86fc938))

## [0.7.6](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/compare/tfds-dashboard-v0.7.5...tfds-dashboard-v0.7.6) (2026-03-04)


### Bug Fixes

* add WebSocket support to GOFF feature flag proxy ([#102](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/102)) ([df1a0e3](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/df1a0e34dc5859db9b4af4fc6a32a92c58c38001))

## [0.7.5](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/compare/tfds-dashboard-v0.7.4...tfds-dashboard-v0.7.5) (2026-03-04)


### Bug Fixes

* use absolute URL for GOFF web provider endpoint ([#99](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/99)) ([129f4a2](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/129f4a2af2b29366ee82f3fc5e01d08a6ef6f03e))

## [0.7.4](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/compare/tfds-dashboard-v0.7.3...tfds-dashboard-v0.7.4) (2026-03-04)


### Bug Fixes

* correct GoFeatureFlag service name in NGINX proxy config ([#96](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/96)) ([d2a1f20](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/d2a1f2045e58ed778b51d6b7d75546de66edcdba))

## [0.7.3](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/compare/tfds-dashboard-v0.7.2...tfds-dashboard-v0.7.3) (2026-03-03)


### Bug Fixes

* defer GoFeatureFlag DNS resolution to prevent NGINX crash ([#92](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/92)) ([399303a](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/399303a082a9382e6dba854cb052ce239af50061))

## [0.7.2](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/compare/tfds-dashboard-v0.7.1...tfds-dashboard-v0.7.2) (2026-03-03)


### Bug Fixes

* parameterize GoFeatureFlag upstream in NGINX config ([#89](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/89)) ([89dbc29](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/89dbc292e809d9431f3c3593cd03da0c83d6bda1))

## [0.7.1](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/compare/tfds-dashboard-v0.7.0...tfds-dashboard-v0.7.1) (2026-03-03)


### Bug Fixes

* wire VITE_GOOGLE_CLIENT_ID build arg and remove stale ExternalSecret ([#86](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/86)) ([d21bcf0](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/d21bcf09cc426187730f119b2519638204e28af6))

## [0.7.0](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/compare/tfds-dashboard-v0.6.0...tfds-dashboard-v0.7.0) (2026-03-03)


### Features

* connect to GoFeatureFlag relay proxy ([#81](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/81)) ([a01c087](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/a01c0872bb7d00a7ab79f5b40f700e7eec9ea5a8))


### Bug Fixes

* trigger auto-merge workflow on image-updater branch push ([#83](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/83)) ([1ca0335](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/1ca033516cb9abce755abad21fe6978c5f8316e7))

## [0.6.0](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/compare/tfds-dashboard-v0.5.5...tfds-dashboard-v0.6.0) (2026-02-26)


### Features

* enable Envoy Gateway for ingress routing ([#77](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/77)) ([ed08c67](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/ed08c67ebd70f3edaf25591bedd9d67eac90d4dd)), closes [#75](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/75)


### Bug Fixes

* specify correct hostname for Envoy Gateway HTTPRoute ([#80](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/80)) ([5d68514](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/5d68514aa47e8066d12c34ebe6cf9777699cabf2))

## [0.5.5](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/compare/tfds-dashboard-v0.5.4...tfds-dashboard-v0.5.5) (2025-12-18)


### Bug Fixes

* use server-snippet annotation to bypass basic auth for InfluxDB ([#66](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/66)) ([e5d69ea](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/e5d69eade2d70879ab6d89f8e39e7935b8412c4f))

## [0.5.4](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/compare/tfds-dashboard-v0.5.3...tfds-dashboard-v0.5.4) (2025-12-18)


### Bug Fixes

* bypass basic auth for InfluxDB proxy endpoint ([#64](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/64)) ([6141b87](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/6141b87b4b70eeaab71d6b47b8a74c69171aa2d5))

## [0.5.3](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/compare/tfds-dashboard-v0.5.2...tfds-dashboard-v0.5.3) (2025-12-16)


### Bug Fixes

* document NGINX proxy DNS resolution approach ([#61](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/61)) ([2492ad4](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/2492ad434e2fb96496f0893af8116676eb258f35))

## [0.5.2](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/compare/tfds-dashboard-v0.5.1...tfds-dashboard-v0.5.2) (2025-12-15)


### Bug Fixes

* use FQDN for InfluxDB service in NGINX proxy ([#57](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/57)) ([81ce948](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/81ce948db40cad3ab434a2777d4d45895bf95b5c))

## [0.5.1](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/compare/tfds-dashboard-v0.5.0...tfds-dashboard-v0.5.1) (2025-12-15)

### Bug Fixes

- correct kube-dns resolver IP for NGINX InfluxDB proxy ([#54](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/54)) ([3476d4f](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/3476d4fcc351191cf7139f4c18ae295daeb7995d))

## [0.5.0](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/compare/tfds-dashboard-v0.4.3...tfds-dashboard-v0.5.0) (2025-12-12)

### Features

- implement server-side InfluxDB token handling for enhanced security ([#51](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/51)) ([c80d49c](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/c80d49c959735b646dac52aa197086b0b3840b89))

## [0.4.3](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/compare/tfds-dashboard-v0.4.2...tfds-dashboard-v0.4.3) (2025-12-11)

### Bug Fixes

- handle missing InfluxDB URL configuration gracefully ([#47](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/47)) ([8fe0ce8](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/8fe0ce8c01a711be32ca499c553afade5dfbb530))

## [0.4.2](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/compare/tfds-dashboard-v0.4.1...tfds-dashboard-v0.4.2) (2025-12-02)

### Bug Fixes

- **build:** prevent lockfile platform compatibility issues ([#41](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/41)) ([f38c501](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/f38c501112fccf8bc63e249724c37908b68a8415))

## [0.4.1](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/compare/tfds-dashboard-v0.4.0...tfds-dashboard-v0.4.1) (2025-11-27)

### Bug Fixes

- **build:** regenerate package-lock.json for multi-platform Docker builds ([#38](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/38)) ([c1ccb56](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/c1ccb5697f09d185ed59f88c34d8c4f180773683))

## [0.4.0](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/compare/tfds-dashboard-v0.3.5...tfds-dashboard-v0.4.0) (2025-11-27)

### Features

- add deploy/values.yaml for ArgoCD deployment config ([#33](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/33)) ([70d540f](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/70d540f55af70764d72b14248b07ee3097448f74))
- add deploy/values.yaml for ArgoCD deployment config ([#35](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/35)) ([de2b998](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/de2b998b6d641d76246d0e9ac88cf85b76a8b5c2))

## [0.3.5](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/compare/tfds-dashboard-v0.3.4...tfds-dashboard-v0.3.5) (2025-11-25)

### Bug Fixes

- replace missing vite.svg favicon with inline data URI ([#31](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/31)) ([2bc9ac7](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/2bc9ac73b364bd075826d972a8d8471d5542a375))

## [0.3.4](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/compare/tfds-dashboard-v0.3.3...tfds-dashboard-v0.3.4) (2025-11-25)

### Bug Fixes

- include public directory in Docker build context ([#29](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/29)) ([0605b10](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/0605b105b5d678bc3350a40089b63c1f8bda2d22))

## [0.3.3](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/compare/tfds-dashboard-v0.3.2...tfds-dashboard-v0.3.3) (2025-11-25)

### Bug Fixes

- **ci:** update container build tag pattern to match release-please ([#26](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/26)) ([129b91e](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/129b91e2d89c83a748fac615a3e75aad2779d564))

## [0.3.2](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/compare/tfds-dashboard-v0.3.1...tfds-dashboard-v0.3.2) (2025-11-25)

### Bug Fixes

- regenerate package-lock.json in Linux container ([#24](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/24)) ([924118e](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/924118e35ecbc789a869de356435f10946483a2c))

## [0.3.1](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/compare/tfds-dashboard-v0.3.0...tfds-dashboard-v0.3.1) (2025-11-25)

### Bug Fixes

- downgrade to Node.js 22 LTS for Docker build compatibility ([#22](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/22)) ([105ebf0](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/105ebf0adfbad57e6d84320e09d11677ec878c84))

## [0.3.0](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/compare/tfds-dashboard-v0.2.0...tfds-dashboard-v0.3.0) (2025-11-20)

### Features

- add app layout ([#17](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/17)) ([08c6ce9](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/08c6ce972f2124d93efec0ea9929f7fb71b667b6))
- add map visualization ([#18](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/18)) ([6f1e4ea](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/6f1e4ea464d94757b31a9282b3038764cf76258d))
- add typescript support ([#15](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/15)) ([15a4f80](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/15a4f80924faf804795ada0e1ab1f19595c13cab))

### Bug Fixes

- container-build error ([#13](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/13)) ([c0ee088](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/c0ee0888011b9e5ce8fe1842059dfd9201a81cba))
- correct GitHub Actions secret reference in workflow conditional ([#5](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/5)) ([b33a8fa](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/b33a8fa7d2d1f9d35135a4699b5b8ae4e25780b4))
- correct Sentry organization name to match auth token ([#7](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/7)) ([d758549](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/d7585495b830b210ef1219ddba52d17662654bb8))
- replace Sentry Docker action with CLI for ARC runner compatibility ([#11](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/11)) ([00ddda5](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/00ddda512b6d520c65e70505f8e5e6c9c6d8dc2a))
- use npm install instead of npm ci in Docker build ([#20](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/20)) ([9056d05](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/9056d05a19dd57008074710642a0b3fced22b30f))

## [0.2.0](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/compare/tfds-dashboard-v0.1.0...tfds-dashboard-v0.2.0) (2025-11-05)

### Features

- add app layout ([#17](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/17)) ([08c6ce9](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/08c6ce972f2124d93efec0ea9929f7fb71b667b6))
- add map visualization ([#18](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/18)) ([6f1e4ea](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/6f1e4ea464d94757b31a9282b3038764cf76258d))
- add typescript support ([#15](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/15)) ([15a4f80](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/15a4f80924faf804795ada0e1ab1f19595c13cab))
- initial TFDS Dashboard React application setup ([#1](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/1)) ([5034528](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/5034528b2c195dcfd67ae6646195efbcb54db1d8))

### Bug Fixes

- container-build error ([#13](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/13)) ([c0ee088](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/c0ee0888011b9e5ce8fe1842059dfd9201a81cba))
- correct GitHub Actions secret reference in workflow conditional ([#5](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/5)) ([b33a8fa](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/b33a8fa7d2d1f9d35135a4699b5b8ae4e25780b4))
- correct Sentry organization name to match auth token ([#7](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/7)) ([d758549](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/d7585495b830b210ef1219ddba52d17662654bb8))
- replace Sentry Docker action with CLI for ARC runner compatibility ([#11](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/11)) ([00ddda5](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/00ddda512b6d520c65e70505f8e5e6c9c6d8dc2a))

## [0.2.0](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/compare/tfds-dashboard-v0.1.0...tfds-dashboard-v0.2.0) (2025-10-16)

### Features

- initial TFDS Dashboard React application setup ([#1](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/1)) ([5034528](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/5034528b2c195dcfd67ae6646195efbcb54db1d8))

### Bug Fixes

- container-build error ([#13](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/13)) ([c0ee088](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/c0ee0888011b9e5ce8fe1842059dfd9201a81cba))
- correct GitHub Actions secret reference in workflow conditional ([#5](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/5)) ([b33a8fa](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/b33a8fa7d2d1f9d35135a4699b5b8ae4e25780b4))
- correct Sentry organization name to match auth token ([#7](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/7)) ([d758549](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/d7585495b830b210ef1219ddba52d17662654bb8))
- replace Sentry Docker action with CLI for ARC runner compatibility ([#11](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/11)) ([00ddda5](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/00ddda512b6d520c65e70505f8e5e6c9c6d8dc2a))

## [0.2.0](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/compare/tfds-dashboard-v0.1.0...tfds-dashboard-v0.2.0) (2025-10-16)

### Features

- initial TFDS Dashboard React application setup ([#1](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/1)) ([5034528](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/5034528b2c195dcfd67ae6646195efbcb54db1d8))

### Bug Fixes

- correct GitHub Actions secret reference in workflow conditional ([#5](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/5)) ([b33a8fa](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/b33a8fa7d2d1f9d35135a4699b5b8ae4e25780b4))
- correct Sentry organization name to match auth token ([#7](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/7)) ([d758549](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/d7585495b830b210ef1219ddba52d17662654bb8))
- replace Sentry Docker action with CLI for ARC runner compatibility ([#11](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/issues/11)) ([00ddda5](https://github.com/ForumViriumHelsinki/TFDS_Dashboard/commit/00ddda512b6d520c65e70505f8e5e6c9c6d8dc2a))

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
