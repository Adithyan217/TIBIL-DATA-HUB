# Use a base image with Node.js installed
FROM node:21.6-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package.json .
# COPY package-lock.json .
# Install dependencies
RUN npm install

# Copy the entire source code to the working directory
COPY . .




# Command to run your application
CMD ["npm", "run", "start"]
