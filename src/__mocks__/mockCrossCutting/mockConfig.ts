import type { IConfig } from '../../interfaces/index';

export function createMockConfig(): jest.Mocked<IConfig> {
  return {
    ACCESS_TOKEN_EXPIRY: '15m',
    BCRYPT_ROUNDS: 1,
    CORS_ORIGIN: '*',
    DATABASE_RETRY_DELAY: 10,
    DATABASE_URL: 'mongodb://localhost:27017/test_db',
    GOOGLE_SHEETS_CLIENT_EMAIL: 'google_sheets_client_email_test',
    GOOGLE_SHEETS_ID: 'google_sheets_id_test',
    GOOGLE_SHEETS_PRIVATE_KEY: 'google_sheets_private_key_test',
    JWT_SECRET: 'jwt_secret_test',
    LOG_FILE_PATH: './test-logs',
    LOG_FORMAT: 'json',
    LOG_LEVEL: 'info',
    MONGO_CONNECT_TIMEOUT_MS: 1000,
    MONGO_SERVER_SELECTION_TIMEOUT_MS: 1000,
    PORT: 3000,
    REFRESH_TOKEN_EXPIRY: '1d',
    REFRESH_TOKEN_SECRET: 'refresh_token_test',
    REPO_OWNER: 'github_owner_test',
    REPO_REPO: 'github_repo_test',
    REPO_TOKEN: 'github_token_test',
  };
}
