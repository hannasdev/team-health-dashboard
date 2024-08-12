# Base Stage
# - Creates a base image with Node.js 20.16.0 on Alpine Linux.
# - Sets up a working directory at /home/nodejs/app with proper permissions.
FROM node:20.16.0-alpine AS base
RUN mkdir -p /home/nodejs/app && chown -R node:node /home/nodejs
WORKDIR /home/nodejs/app

# Dependencies Stage
# - Builds upon the base image.
# - Switches to the non-root 'node' user.
# - Copies package.json and package-lock.json.
# - Installs dependencies using npm ci.
FROM base AS dependencies
USER node
COPY --chown=node:node package*.json ./
RUN npm ci

# Build Stage
# - Builds upon the dependencies stage.
# - Copies TypeScript configuration and source files.
# - Builds the project (transpiling TypeScript to JavaScript).
FROM dependencies AS build
COPY --chown=node:node tsconfig.json ./
COPY --chown=node:node ./src ./src
RUN npm run build

# Test Stage
# - Builds upon the build stage.
# - Copies the jest.config.docker.js file to the root folder (app).
# - Removes src/ as it is no longer needed.
FROM build AS test
COPY --chown=node:node jest.config.docker.js ./
RUN rm -rf ./src

# Unit Test Stage
# - Builds upon the unit-test stage.
# - Commands run in docker-compose.yml
FROM test AS unit-test

# E2E Test Stage
# - Similar to the unit test stage, but set up for E2E tests.
FROM test AS e2e-test 
CMD ["node", "--experimental-vm-modules", "node_modules/.bin/jest", "--config", "jest.config.docker.js", "--testMatch", "**/*.e2e-spec.js"]

# Production Stage 
# - Builds a lean production image.
# - Installs only production dependencies.
# - Copies built files from the build stage.
# - Sets up logging directory.
# - Exposes port 3000 and sets up command to run the application.
FROM base AS production 
ENV NODE_ENV=production
USER node
COPY --chown=node:node package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY --chown=node:node --from=build /home/nodejs/app/dist ./dist 
RUN mkdir -p logs && chown node:node logs
ENV PORT=3000
EXPOSE $PORT
CMD ["node", "./dist/index.js"]