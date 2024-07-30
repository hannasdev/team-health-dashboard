// src/interfaces/IConfig.ts
export interface IConfig {
  GOOGLE_SHEETS_CLIENT_EMAIL: string;
  GOOGLE_SHEETS_PRIVATE_KEY: string;
  GOOGLE_SHEETS_ID: string;
  GITHUB_TOKEN: string;
  GITHUB_OWNER: string;
  GITHUB_REPO: string;
  PORT: number | string;
}
