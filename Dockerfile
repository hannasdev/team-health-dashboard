# Base Stage
FROM node:20.16.0-alpine AS base
WORKDIR /app

# Build Stage
FROM base AS build
COPY package*.json ./
COPY tsconfig.json ./
RUN npm ci
COPY ./src ./src
RUN npm run build:prod

# Unit Test Stage
FROM build AS unit-test
COPY jest.config.ts ./
COPY setupTests.ts ./
CMD ["npm", "run", "test:unit"]

# E2E Test Stage
FROM base AS e2e-test
COPY jest.config.ts ./
COPY setupTestsE2E.ts ./
CMD ["npm", "run", "test:e2e"]

# Production Stage
FROM base AS production
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=build /app/dist ./dist

# Create a non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Set environment variables
ENV PORT=3000
EXPOSE $PORT

CMD ["node", "./dist/index.js"]