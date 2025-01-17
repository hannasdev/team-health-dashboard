# Base Stage
# - Creates a base image with Node.js 23.5.0 on Alpine Linux.
# - Sets up a working directory at /home/nodejs/app with proper permissions.
FROM node:23.5.0-alpine AS base
RUN apk add --no-cache curl bash netcat-openbsd
RUN mkdir -p /home/nodejs/app && chown -R node:node /home/nodejs
WORKDIR /home/nodejs/app

COPY docker-healthcheck.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-healthcheck.sh

# Add wait-for-it script (as root) and modify it to use sh
ADD https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh /usr/local/bin/wait-for-it.sh
RUN chmod 755 /usr/local/bin/wait-for-it.sh

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
# Copy wait-for-it script from base stage and ensure it has correct permissions
COPY --from=base --chown=node:node /usr/local/bin/docker-healthcheck.sh /usr/local/bin/docker-healthcheck.sh
COPY --from=base --chown=node:node /usr/local/bin/wait-for-it.sh /home/nodejs/wait-for-it.sh
CMD ["node", "--experimental-vm-modules", "node_modules/.bin/jest", "--config", "jest.config.docker.js", "--testMatch", "**/dist/__tests__/e2e/**/*.e2e.spec.js", "--detectOpenHandles", "--runInBand", "--verbose"]

# Production Stage 
# - Builds a lean production image.
# - Installs only production dependencies.
# - Copies built files from the build stage.
# - Sets up logging directory.
# - Exposes port 3000 and sets up command to run the application.
FROM base AS production 
COPY --from=base --chown=node:node /usr/local/bin/docker-healthcheck.sh /usr/local/bin/docker-healthcheck.sh
ENV NODE_ENV=production
USER node
COPY --chown=node:node package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY --chown=node:node --from=build /home/nodejs/app/dist ./dist 
RUN mkdir -p logs && chown node:node logs
ENV PORT=3000
EXPOSE $PORT
CMD ["node", "./dist/index.js"]