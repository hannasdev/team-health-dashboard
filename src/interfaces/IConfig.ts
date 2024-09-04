// src/interfaces/IConfig.ts

export interface IConfig {
  GOOGLE_SHEETS_CLIENT_EMAIL: string;
  GOOGLE_SHEETS_PRIVATE_KEY: string;
  GOOGLE_SHEETS_ID: string;
  REPO_TOKEN: string;
  REPO_OWNER: string;
  REPO_REPO: string;
  PORT: number;
  CORS_ORIGIN: string;
  JWT_SECRET: string;
  REFRESH_TOKEN_SECRET: string;
  DATABASE_URL: string;
  MONGO_CONNECT_TIMEOUT_MS: number;
  MONGO_SERVER_SELECTION_TIMEOUT_MS: number;
  LOG_LEVEL: string;
  LOG_FORMAT: string;
  LOG_FILE_PATH: string;
  ACCESS_TOKEN_EXPIRY: string;
  REFRESH_TOKEN_EXPIRY: string;
  BCRYPT_ROUNDS: number;
  SSE_TIMEOUT: number;
  HEARTBEAT_INTERVAL: number;
}
