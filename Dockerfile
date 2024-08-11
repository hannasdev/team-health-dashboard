# Base Stage
FROM node:20.16.0-alpine AS base

# Build Stage
FROM base AS build
COPY package*.json ./
COPY tsconfig.json ./
RUN npm ci
COPY ./src ./src
RUN npm run build

# Unit Test Stage
FROM build AS unit-test
COPY jest.config.ts ./
CMD ["npm", "run", "test:unit"]

# E2E Test Stage
FROM build AS e2e-test 
COPY package-lock.json ./
COPY jest.config.ts ./
CMD ["npm", "run", "test:e2e"]

# Production Stage 
FROM base AS production 
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production

COPY --from=build /app/dist ./dist 

# Create a non-root user 
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Must be after user creation
RUN echo "Setting WORKDIR for nodejs user"
WORKDIR /app

# Create logs directory and set permissions
RUN mkdir logs && chown nodejs:nodejs logs

# Set environment variables
ENV PORT=3000
EXPOSE $PORT

CMD ["node", "./dist/index.js"]