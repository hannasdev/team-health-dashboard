# Base Stage
FROM node:20.16.0-alpine AS base
WORKDIR /app

# Build Stage
FROM base AS build
COPY package*.json ./
COPY webpack.config*.js ./
COPY tsconfig.json ./
RUN npm ci
COPY ./src ./src
RUN npm run build

# Test Stage
FROM base AS test
COPY package*.json ./
COPY tsconfig.json ./
COPY jest.config.ts ./
COPY setupTests.ts ./
RUN npm ci
COPY --from=build /app/dist /app/dist
COPY ./src ./src
CMD ["npm", "run", "test"]

# Production Stage
FROM base AS production
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=build /app/dist /app/dist

# Copy necessary config files
COPY tsconfig.json ./
COPY webpack.config*.js ./

# Create a non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Set environment variables
ENV PORT=3000
EXPOSE $PORT

CMD ["node", "dist/index.cjs"]