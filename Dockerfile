# Base Stage
FROM node:20.16.0 AS base
WORKDIR /app

# Build Stage
FROM base AS build
COPY package*.json ./
# Copy Webpack config
COPY webpack.config*.js ./ 
COPY tsconfig.json ./ 
RUN npm ci --omit=dev
COPY ./src ./src
RUN npm run build

# Test Stage
FROM base AS test
COPY package*.json ./
COPY tsconfig.json ./
COPY jest.config.ts ./
COPY setupTests.ts ./
RUN npm ci 
# Copy built files from build stage
COPY --from=build /app/dist /app/dist 
CMD ["npm", "run", "test"]