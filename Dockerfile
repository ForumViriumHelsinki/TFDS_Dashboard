FROM node:23-alpine AS build

# Build arguments for Vite environment variables and Sentry
ARG VITE_APP_VERSION
ARG VITE_SENTRY_DSN
ARG SENTRY_AUTH_TOKEN

# Set environment variables for the build
ENV VITE_APP_VERSION=${VITE_APP_VERSION}
ENV VITE_SENTRY_DSN=${VITE_SENTRY_DSN}
ENV SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN}

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy application source
COPY . .

# Build the application (source maps uploaded to Sentry if SENTRY_AUTH_TOKEN is provided)
RUN npm run build

# Production stage
FROM nginx:1.27-alpine

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
