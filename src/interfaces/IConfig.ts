// src/interfaces/IConfig.ts
export interface IConfig {
  GOOGLE_SHEETS_CLIENT_EMAIL: string;
  GOOGLE_SHEETS_PRIVATE_KEY: string;
  GOOGLE_SHEETS_ID: string;
  GITHUB_TOKEN: string;
  GITHUB_OWNER: string;
  GITHUB_REPO: string;
  PORT: number;
  CORS_ORIGIN: string;
  JWT_SECRET: string;
  DATABASE_URL: string;
  MONGO_CONNECT_TIMEOUT_MS: number;
  MONGO_SERVER_SELECTION_TIMEOUT_MS: number;
  LOG_LEVEL: string;
  LOG_FORMAT: string;
  LOG_FILE_PATH: string;
}
