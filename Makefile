# TFDS Dashboard Makefile

.PHONY: deps-update dev build test lint

# Update dependencies using Docker to ensure cross-platform compatibility
# This prevents issues with platform-specific optional dependencies (e.g., rollup)
deps-update:
	rm -rf node_modules package-lock.json
	docker run --rm --platform=linux/amd64 -v "$$(pwd)":/app -w /app node:22-alpine npm install

# Development server
dev:
	npm run dev

# Production build
build:
	npm run build

# Run tests
test:
	npm test

# Run linting
lint:
	npm run lint
