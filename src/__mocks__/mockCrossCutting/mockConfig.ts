import type { IConfig } from '../../interfaces/index';

export function createMockConfig(): jest.Mocked<IConfig> {
  return {
    GOOGLE_SHEETS_CLIENT_EMAIL: 'google_sheets_client_email_test',
    GOOGLE_SHEETS_PRIVATE_KEY: 'google_sheets_private_key_test',
    GOOGLE_SHEETS_ID: 'google_sheets_id_test',
    REPO_TOKEN: 'github_token_test',
    REPO_OWNER: 'github_owner_test',
    REPO_REPO: 'github_repo_test',
    PORT: 3000,
    CORS_ORIGIN: '*',
    JWT_SECRET: 'jwt_secret_test',
    REFRESH_TOKEN_SECRET: 'refresh_token_test',
    DATABASE_URL: 'mongodb://localhost:27017/test_db',
    MONGO_CONNECT_TIMEOUT_MS: 1000,
    MONGO_SERVER_SELECTION_TIMEOUT_MS: 1000,
    LOG_LEVEL: 'info',
    LOG_FORMAT: 'json',
    LOG_FILE_PATH: './test-logs',
    BCRYPT_ROUNDS: 1,
    ACCESS_TOKEN_EXPIRY: '15m',
    REFRESH_TOKEN_EXPIRY: '1d',
    SSE_TIMEOUT: 120000,
    HEARTBEAT_INTERVAL: 15000,
  };
}
