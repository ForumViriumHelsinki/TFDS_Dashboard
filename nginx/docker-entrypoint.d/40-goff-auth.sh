#!/bin/sh
# Generate nginx configuration for GoFeatureFlag authorization header.
# Only sets the Authorization header if GOFF_API_KEY is non-empty,
# avoiding an empty "Bearer " header in local development.
set -e

GOFF_AUTH_CONF="/etc/nginx/conf.d/goff-auth-header.inc"

if [ -n "${GOFF_API_KEY:-}" ]; then
    printf 'proxy_set_header Authorization "Bearer %s";\n' "$GOFF_API_KEY" > "$GOFF_AUTH_CONF"
else
    # Write an empty file so the include directive succeeds without sending a header
    : > "$GOFF_AUTH_CONF"
fi
