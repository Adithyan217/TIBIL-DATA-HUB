#!/bin/bash

# Paths to your files
ENV_FILE=".env"
VERSION_FILE=".version"

# Check if all required files exist
if [[ ! -f "$ENV_FILE" || ! -f "$VERSION_FILE" ]]; then
  echo "One or more required files do not exist."
  exit 1
fi

# Read current MINOR_VERSION from .env file
CURRENT_MINOR_VERSION=$(grep -oP '^MINOR_VERSION=\K\d+' "$ENV_FILE")

# Read current version from .version file
CURRENT_VERSION=$(grep -oP 'current-version:\s*\K\d+' "$VERSION_FILE")

# Check if values are found
if [[ -z "$CURRENT_MINOR_VERSION" || -z "$CURRENT_VERSION" ]]; then
  echo "MINOR_VERSION or current-version not found."
  exit 1
fi

# Calculate the new version (increment by 1)
NEW_VERSION=$((CURRENT_VERSION + 1))

# Update MINOR_VERSION in .env file
sed -i -E "s/^MINOR_VERSION=[0-9]+/MINOR_VERSION=$NEW_VERSION/" "$ENV_FILE"

# Update the .version file
sed -i -E "s|(current-version:\s*)[0-9]+|\1$NEW_VERSION|" "$VERSION_FILE"

echo "Successfully updated MINOR_VERSION in .env to $NEW_VERSION"
echo "Successfully updated current-version in .version to $NEW_VERSION"