#!/bin/sh
# Generate k8s secrets from templates with environment variable substitution
# Sets defaults for any unset variables

# Set defaults for InfluxDB (only if not already set)
export INFLUXDB_TOKEN="${INFLUXDB_TOKEN:-your-development-influxdb-token-here}"

# Generate secret.yaml from template
envsubst < k8s/secret.yaml.tmpl > k8s/secret.yaml

echo "✓ Generated k8s/secret.yaml"
