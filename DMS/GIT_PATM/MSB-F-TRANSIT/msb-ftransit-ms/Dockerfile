FROM node:23.0-alpine

# Install AWS CLI and other dependencies
RUN apk update && apk upgrade && \
    apk add --no-cache \
    curl \
    bash \
    aws-cli \
    jq && \
    curl --version && \
    musl-gcc --version || true && \
    busybox | head -n 1 || true

# Set working directory
WORKDIR /app

# Create the secrets directory
RUN mkdir -p /app/src/secrets

# Copy package.json and install dependencies
COPY package.json .
RUN npm install

# Copy the rest of your application code
COPY . .

# Expose port for your app
EXPOSE 3009

# Copy the entrypoint script from the scripts folder
COPY scripts/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Set entrypoint to the script
ENTRYPOINT ["/entrypoint.sh"]

# Command to run your application
CMD ["npm", "run", "start"]