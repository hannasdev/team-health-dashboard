# Base Stage
FROM node:20.16.0-alpine AS base
RUN mkdir -p /home/nodejs/app && chown -R node:node /home/nodejs
WORKDIR /home/nodejs/app

# Dependencies Stage
FROM base AS dependencies
USER node
COPY --chown=node:node package*.json ./
RUN npm ci

# Build Stage
FROM dependencies AS build
COPY --chown=node:node tsconfig.json ./
COPY --chown=node:node ./src ./src
RUN npm run build

# Unit Test Stage
FROM build AS unit-test
COPY --chown=node:node jest.config.docker.js ./
CMD ["node", "--experimental-vm-modules", "node_modules/.bin/jest", "--config", "jest.config.js", "--testMatch", "**/dist/**/*.test.js"]

# E2E Test Stage
FROM build AS e2e-test 
COPY --chown=node:node jest.config.docker.js ./
CMD ["node", "--experimental-vm-modules", "node_modules/.bin/jest", "--config", "jest.config.js", "--testMatch", "**/dist/**/*.e2e.spec.js"]

# Production Stage 
FROM base AS production 
ENV NODE_ENV=production
USER node

COPY --chown=node:node package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built files
COPY --chown=node:node --from=build /home/nodejs/app/dist ./dist 
# Create logs directory with correct permissions
RUN mkdir -p logs && chown node:node logs

# Set environment variables
ENV PORT=3000
EXPOSE $PORT

CMD ["node", "./dist/index.js"]