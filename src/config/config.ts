// src/config/config.ts
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  GOOGLE_SHEETS_CLIENT_EMAIL: process.env.GOOGLE_SHEETS_CLIENT_EMAIL!,
  GOOGLE_SHEETS_PRIVATE_KEY: process.env.GOOGLE_SHEETS_PRIVATE_KEY!,
  GOOGLE_SHEETS_ID: process.env.GOOGLE_SHEETS_ID!,
  GITHUB_TOKEN: process.env.GITHUB_TOKEN!,
  GITHUB_OWNER: process.env.GITHUB_OWNER!,
  GITHUB_REPO: process.env.GITHUB_REPO!,
  PORT: process.env.PORT || 3000,
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*', // Default to all origins if not set
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  DATABASE_URL:
    process.env.DATABASE_URL ||
    'mongodb://localhost:27017/team-heath-dashboard',
  MONGO_CONNECT_TIMEOUT_MS: process.env.NODE_ENV === 'test' ? 1000 : 5000,
  MONGO_SERVER_SELECTION_TIMEOUT_MS:
    process.env.NODE_ENV === 'test' ? 1000 : 5000,
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FORMAT: process.env.LOG_FORMAT || 'json',
  LOG_FILE_PATH: process.env.LOG_FILE_PATH || './logs',
};

// Optional: Validate config
Object.entries(config).forEach(([key, value]) => {
  if (value === undefined) {
    throw new Error(`Environment variable ${key} is not set`);
  }
});
