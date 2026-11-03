#!/bin/bash

echo "Fetching secrets from AWS Secrets Manager..."

# Fetch the first secret and save it to a file
aws secretsmanager get-secret-value \
  --secret-id dev-drouter-ms \
  --region ap-south-1 \
  --query SecretString \
  --output text > /app/src/secrets/dev-drouter-ms

echo "Secret dev-drouter-ms written to /app/src/secrets/dev-drouter-ms"

aws secretsmanager get-secret-value \
  --secret-id dev-msb-listener-ms \
  --region ap-south-1 \
  --query SecretString \
  --output text > /app/src/secrets/dev-msb-listener-ms

echo "Secret dev-msb-literner-ms written to /app/src/secrets/dev-msb-listener-ms"

aws secretsmanager get-secret-value \
  --secret-id dev-dlistner-config \
  --region ap-south-1 \
  --query SecretString \
  --output text > /app/src/secrets/dev-dlistner-config

echo "Secret dev-dlistner-config written to /app/src/secrets/dev-dlistner-config"


# Fetch the second secret and save it to a file
aws secretsmanager get-secret-value \
  --secret-id dev-common-secrets \
  --region ap-south-1 \
  --query SecretString \
  --output text > /app/src/secrets/dev-common-secrets

echo "Secret uat-common-secrets written to /app/src/secrets/dev-common-secrets"

# Start the Node.js app
exec npm run start