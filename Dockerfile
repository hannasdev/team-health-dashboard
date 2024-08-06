# Build stage
FROM node:18 AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

# Add labels
LABEL Name="team-health-dashboard"
LABEL Version="1.0.0"

# Install MongoDB tools
RUN apk add --no-cache mongodb-tools

# Set working directory
WORKDIR /app

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Expose port
EXPOSE 3000

# Set start command
CMD ["node", "dist/index.js"]