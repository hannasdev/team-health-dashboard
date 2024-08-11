# Base Stage
FROM node:20.16.0-alpine AS base
RUN mkdir -p /home/nodejs/app && chown -R node:node /home/nodejs
WORKDIR /home/nodejs/app

# Build Stage
FROM base AS build
USER node
COPY --chown=node:node package*.json ./
COPY --chown=node:node tsconfig.json ./
RUN npm ci
COPY --chown=node:node ./src ./src
RUN npm run build
RUN ls -la /home/nodejs/app  # Debug: List contents after build

# Unit Test Stage
FROM build AS unit-test
COPY --chown=node:node jest.config.ts ./
COPY --chown=node:node jest.global-setup.mjs ./
COPY --chown=node:node jest.global-teardown.mjs ./
CMD ["npm", "run", "test:unit"]

# E2E Test Stage
FROM build AS e2e-test 
COPY --chown=node:node package-lock.json ./
COPY --chown=node:node jest.config.ts ./
CMD ["npm", "run", "test:e2e"]

# Production Stage 
FROM base AS production 
ENV NODE_ENV=production
USER node

COPY --chown=node:node package*.json ./
RUN npm ci --only=production

# Copy built files
COPY --chown=node:node --from=build /home/nodejs/app/dist ./dist 
# Create logs directory with correct permissions
RUN mkdir -p logs && chown node:node logs

# Set environment variables
ENV PORT=3000
EXPOSE $PORT

CMD ["node", "./dist/index.js"]