FROM node:22-alpine AS build

# Build arguments for Vite environment variables and Sentry
# Note: VITE_INFLUXDB_URL and VITE_INFLUXDB_TOKEN are NOT included here
# The app uses /influxdb-api proxy endpoint instead of direct connection
ARG VITE_INFLUXDB_ORG=idea-helsinki
ARG VITE_INFLUXDB_BUCKET=idea-validation-bucket
ARG VITE_APP_VERSION=dev
ARG VITE_SENTRY_DSN=""
ARG SENTRY_AUTH_TOKEN=""

# Set environment variables for the build
# Defaults are set above for local development with Skaffold
# GitHub Actions overrides these with secrets for production builds
ENV VITE_INFLUXDB_ORG=${VITE_INFLUXDB_ORG}
ENV VITE_INFLUXDB_BUCKET=${VITE_INFLUXDB_BUCKET}
ENV VITE_APP_VERSION=${VITE_APP_VERSION}
ENV VITE_SENTRY_DSN=${VITE_SENTRY_DSN}
ENV SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN}

WORKDIR /app

# Copy package files and install dependencies
# Note: Using 'npm install' instead of 'npm ci' to work around npm bug with
# optional dependencies (https://github.com/npm/cli/issues/4828) that prevents
# Rollup's platform-specific native bindings from being installed correctly
COPY package*.json ./
RUN npm install

# Copy application source
COPY . .

# Build the application (source maps uploaded to Sentry if SENTRY_AUTH_TOKEN is provided)
RUN npm run build

# Production stage
FROM nginx:1.27-alpine

# Set default environment variables for NGINX template substitution
# These can be overridden at runtime via Kubernetes ConfigMap/Secrets
# Use http:// for internal K8s services (HTTPS is terminated at ingress)
ENV INFLUXDB_URL=http://idea-helsinki-influxdb-helm-webapp.idea-helsinki.svc.cluster.local:8086 \
    INFLUXDB_HOST=idea-helsinki-influxdb-helm-webapp.idea-helsinki.svc.cluster.local:8086 \
    INFLUXDB_TOKEN=""

# Copy built application
COPY --from=build /app/dist /usr/share/nginx/html

# Copy NGINX configuration
COPY nginx/default.conf.template /etc/nginx/templates/

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Note: nginx:alpine runs as root but nginx process drops privileges internally
# If running as non-root user is required, uncomment the following and ensure proper permissions:
# RUN chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /var/run
# USER nginx
