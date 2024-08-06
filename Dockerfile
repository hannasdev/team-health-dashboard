# syntax=docker/dockerfile:1

# Build stage
FROM node:20.16.0 AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies, including devDependencies
RUN npm ci --legacy-peer-deps

# Copy source files and configs
COPY . .

# Build the application using webpack
RUN npm run build

# Production stage
FROM node:20.16.0-alpine

# Add labels
LABEL Name="team-health-dashboard"
LABEL Version="1.0.0"

# Set Node.js to production mode
ENV NODE_ENV=production

# Install MongoDB tools
RUN apk add --no-cache mongodb-tools

# Set working directory
WORKDIR /app

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --only=production --legacy-peer-deps

# Expose port
EXPOSE 3000

# Set start command
CMD ["node", "--experimental-specifier-resolution=node", "--es-module-specifier-resolution=node", "dist/main.js"]