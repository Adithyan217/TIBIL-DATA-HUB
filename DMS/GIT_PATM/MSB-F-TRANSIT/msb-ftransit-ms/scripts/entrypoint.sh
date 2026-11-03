#!/bin/bash

echo "Fetching secrets from AWS Secrets Manager..."

# Fetch the first secret and save it to a file
aws secretsmanager get-secret-value \
  --secret-id dev-ftransit-ms \
  --region ap-south-1 \
  --query SecretString \
  --output text > /app/src/secrets/dev-ftransit-ms

echo "Secret uat-drouter-ms written to /app/src/secrets/dev-ftransit-ms"

# Fetch the second secret and save it to a file
aws secretsmanager get-secret-value \
  --secret-id dev-common-secrets \
  --region ap-south-1 \
  --query SecretString \
  --output text > /app/src/secrets/dev-common-secrets

echo "Secret uat-common-secrets written to /app/src/secrets/dev-common-secrets"

# Start the Node.js app
exec npm run start