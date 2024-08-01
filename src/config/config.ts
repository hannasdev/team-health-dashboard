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
};

// Optional: Validate config
Object.entries(config).forEach(([key, value]) => {
  if (value === undefined) {
    throw new Error(`Environment variable ${key} is not set`);
  }
});
