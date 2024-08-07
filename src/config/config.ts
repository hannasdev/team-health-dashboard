// config/config.ts
import dotenv from 'dotenv';

import { IConfig } from '@/interfaces';

export class Config implements IConfig {
  private static instance: Config;

  private constructor() {
    // eslint-disable-next-line import-x/no-named-as-default-member
    dotenv.config();
    this.validate();
  }

  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  public get GOOGLE_SHEETS_CLIENT_EMAIL(): string {
    return process.env.GOOGLE_SHEETS_CLIENT_EMAIL!;
  }

  public get GOOGLE_SHEETS_PRIVATE_KEY(): string {
    return process.env.GOOGLE_SHEETS_PRIVATE_KEY!;
  }

  public get GOOGLE_SHEETS_ID(): string {
    return process.env.GOOGLE_SHEETS_ID!;
  }

  public get GITHUB_TOKEN(): string {
    return process.env.GITHUB_TOKEN!;
  }

  public get GITHUB_OWNER(): string {
    return process.env.GITHUB_OWNER!;
  }

  public get GITHUB_REPO(): string {
    return process.env.GITHUB_REPO!;
  }

  public get PORT(): number {
    return Number(process.env.PORT) || 3000;
  }

  public get CORS_ORIGIN(): string {
    return process.env.CORS_ORIGIN || '*';
  }

  public get JWT_SECRET(): string {
    return process.env.JWT_SECRET || 'your-secret-key';
  }

  public get DATABASE_URL(): string {
    return (
      process.env.DATABASE_URL ||
      'mongodb://localhost:27017/team-heath-dashboard'
    );
  }

  public get MONGO_CONNECT_TIMEOUT_MS(): number {
    return process.env.NODE_ENV === 'test' ? 1000 : 5000;
  }

  public get MONGO_SERVER_SELECTION_TIMEOUT_MS(): number {
    return process.env.NODE_ENV === 'test' ? 1000 : 5000;
  }

  public get LOG_LEVEL(): string {
    return process.env.LOG_LEVEL || 'info';
  }

  public get LOG_FORMAT(): string {
    return process.env.LOG_FORMAT || 'json';
  }

  public get LOG_FILE_PATH(): string {
    return process.env.LOG_FILE_PATH || './logs';
  }

  private validate(): void {
    const requiredEnvVars = [
      'GOOGLE_SHEETS_CLIENT_EMAIL',
      'GOOGLE_SHEETS_PRIVATE_KEY',
      'GOOGLE_SHEETS_ID',
      'GITHUB_TOKEN',
      'GITHUB_OWNER',
      'GITHUB_REPO',
      'JWT_SECRET',
    ];

    requiredEnvVars.forEach(varName => {
      if (!process.env[varName]) {
        throw new Error(`Environment variable ${varName} is not set`);
      }
    });
  }
}

export const config = Config.getInstance();
