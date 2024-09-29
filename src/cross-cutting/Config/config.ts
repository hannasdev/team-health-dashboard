// config/config.ts
import fs from 'fs';
import path from 'path';

import dotenv from 'dotenv';

import { AppError } from '../../utils/errors.js';

import type { IConfig } from '../../interfaces/index.js';

export class Config implements IConfig {
  private static instance: Config | null = null;
  private config: IConfig;

  private constructor(
    env?: Partial<IConfig>,
    customEnvLoader?: () => NodeJS.ProcessEnv,
  ) {
    if (process.env.NODE_ENV !== 'test' && !customEnvLoader) {
      this.loadEnvFile();
    }
    this.config = {
      ...this.loadDefaults(),
      ...this.loadFromEnv(customEnvLoader),
      ...env,
    };
    this.validate();
  }

  public static getInstance(
    env?: Partial<IConfig>,
    customEnvLoader?: () => NodeJS.ProcessEnv,
  ): Config {
    if (!Config.instance) {
      Config.instance = new Config(env, customEnvLoader);
    }
    return Config.instance;
  }

  private loadDefaults(): IConfig {
    return {
      ACCESS_TOKEN_EXPIRY: '15m',
      BCRYPT_ROUNDS: 10,
      CORS_ORIGIN: '*',
      DATABASE_URL: 'default-database-url',
      GOOGLE_SHEETS_CLIENT_EMAIL: 'default-client-email',
      GOOGLE_SHEETS_ID: 'default-sheet-id',
      GOOGLE_SHEETS_PRIVATE_KEY: '',
      JWT_SECRET: 'default-jwt-secret',
      LOG_FILE_PATH: './logs',
      LOG_FORMAT: 'json',
      LOG_LEVEL: 'info',
      MONGO_CONNECT_TIMEOUT_MS: 30000,
      MONGO_SERVER_SELECTION_TIMEOUT_MS: 30000,
      PORT: 3000,
      REFRESH_TOKEN_EXPIRY: '7d',
      REFRESH_TOKEN_SECRET: 'default-refresh-token-secret',
      REPO_OWNER: 'default-repo-owner',
      REPO_REPO: 'default-repo-repo',
      REPO_TOKEN: 'default-repo-token',
    };
  }

  private loadFromEnv(
    customEnvLoader?: () => NodeJS.ProcessEnv,
  ): Partial<IConfig> {
    const envVars = customEnvLoader ? customEnvLoader() : process.env;

    return {
      ACCESS_TOKEN_EXPIRY: envVars.ACCESS_TOKEN_EXPIRY || undefined,
      BCRYPT_ROUNDS: envVars.BCRYPT_ROUNDS
        ? parseInt(envVars.BCRYPT_ROUNDS, 10)
        : undefined,
      CORS_ORIGIN: envVars.CORS_ORIGIN || undefined,
      DATABASE_URL: envVars.DATABASE_URL || undefined,
      GOOGLE_SHEETS_CLIENT_EMAIL:
        envVars.GOOGLE_SHEETS_CLIENT_EMAIL || undefined,
      GOOGLE_SHEETS_ID: envVars.GOOGLE_SHEETS_ID || undefined,
      GOOGLE_SHEETS_PRIVATE_KEY: envVars.GOOGLE_SHEETS_PRIVATE_KEY || undefined,
      JWT_SECRET: envVars.JWT_SECRET || undefined,
      LOG_FILE_PATH: envVars.LOG_FILE_PATH || undefined,
      LOG_FORMAT: envVars.LOG_FORMAT || undefined,
      LOG_LEVEL: envVars.LOG_LEVEL || undefined,
      MONGO_CONNECT_TIMEOUT_MS: envVars.MONGO_CONNECT_TIMEOUT_MS
        ? parseInt(envVars.MONGO_CONNECT_TIMEOUT_MS, 10)
        : undefined,
      MONGO_SERVER_SELECTION_TIMEOUT_MS:
        envVars.MONGO_SERVER_SELECTION_TIMEOUT_MS
          ? parseInt(envVars.MONGO_SERVER_SELECTION_TIMEOUT_MS, 10)
          : undefined,
      PORT: envVars.PORT ? parseInt(envVars.PORT, 10) : undefined,
      REFRESH_TOKEN_EXPIRY: envVars.REFRESH_TOKEN_EXPIRY || undefined,
      REFRESH_TOKEN_SECRET: envVars.REFRESH_TOKEN_SECRET || undefined,
      REPO_OWNER: envVars.REPO_OWNER || undefined,
      REPO_REPO: envVars.REPO_REPO || undefined,
      REPO_TOKEN: envVars.REPO_TOKEN || undefined,
    };
  }

  private loadEnvFile(): void {
    const envPath = '.env';
    const envFilePath = path.resolve(process.cwd(), envPath);
    if (fs.existsSync(envFilePath)) {
      dotenv.config({ path: envFilePath });
    }
  }

  private validate(): void {
    const requiredEnvVars: (keyof IConfig)[] = [
      'GOOGLE_SHEETS_CLIENT_EMAIL',
      'GOOGLE_SHEETS_PRIVATE_KEY',
      'GOOGLE_SHEETS_ID',
      'REPO_TOKEN',
      'REPO_OWNER',
      'REPO_REPO',
      'JWT_SECRET',
      'REFRESH_TOKEN_SECRET',
      'DATABASE_URL',
    ];

    const missingVars = requiredEnvVars.filter(
      varName => !this.config[varName],
    );

    if (missingVars.length > 0) {
      throw new AppError(
        500,
        `Missing required environment variables: ${missingVars.join(', ')}`,
      );
    }
  }

  public static resetInstance(): void {
    Config.instance = null;
  }

  public getAllConfig(): IConfig {
    return { ...this.config };
  }

  public static generateEnvTemplate(
    outputPath: string = '.env.template',
  ): void {
    const defaults = this.getInstance().loadDefaults();
    const template = Object.entries(defaults)
      .map(([key, value]) => {
        let comment = '';
        switch (key) {
          case 'ACCESS_TOKEN_EXPIRY':
            comment =
              '# Duration for access token validity (e.g., 15m, 1h, 1d)';
            break;
          case 'BCRYPT_ROUNDS':
            comment = '# Number of bcrypt hashing rounds';
            break;
          case 'CORS_ORIGIN':
            comment = comment =
              '# Allowed CORS origins (comma-separated list or "*" for all)';
            break;
          case 'DATABASE_URL':
            comment = '# MongoDB connection string';
            break;
          case 'JWT_SECRET':
          case 'REFRESH_TOKEN_SECRET':
            comment =
              '# Secret key for JWT signing (change this to a secure random string)';
            value = 'your-secret-key-here';
            break;
          case 'PORT':
            comment = '# Port on which the server will listen';
            break;
          // Add comments for other variables as needed
        }
        return `${comment}\n${key}=${value}`;
      })
      .join('\n\n');

    const fullPath = path.resolve(process.cwd(), outputPath);
    fs.writeFileSync(fullPath, template);
  }

  // Getters
  public get GOOGLE_SHEETS_CLIENT_EMAIL(): string {
    return this.config.GOOGLE_SHEETS_CLIENT_EMAIL;
  }

  public get GOOGLE_SHEETS_PRIVATE_KEY(): string {
    return this.config.GOOGLE_SHEETS_PRIVATE_KEY;
  }

  public get GOOGLE_SHEETS_ID(): string {
    return this.config.GOOGLE_SHEETS_ID;
  }

  public get REPO_TOKEN(): string {
    return this.config.REPO_TOKEN;
  }

  public get REPO_OWNER(): string {
    return this.config.REPO_OWNER;
  }

  public get REPO_REPO(): string {
    return this.config.REPO_REPO;
  }

  public get PORT(): number {
    return this.config.PORT;
  }

  public get CORS_ORIGIN(): string {
    return this.config.CORS_ORIGIN;
  }

  public get JWT_SECRET(): string {
    return this.config.JWT_SECRET;
  }

  public get REFRESH_TOKEN_SECRET(): string {
    return this.config.REFRESH_TOKEN_SECRET;
  }

  public get DATABASE_URL(): string {
    return this.config.DATABASE_URL;
  }

  public get MONGO_CONNECT_TIMEOUT_MS(): number {
    return this.config.MONGO_CONNECT_TIMEOUT_MS || 30000;
  }

  public get MONGO_SERVER_SELECTION_TIMEOUT_MS(): number {
    return this.config.MONGO_SERVER_SELECTION_TIMEOUT_MS || 30000;
  }

  public get LOG_LEVEL(): string {
    return this.config.LOG_LEVEL;
  }

  public get LOG_FORMAT(): string {
    return this.config.LOG_FORMAT;
  }

  public get LOG_FILE_PATH(): string {
    return this.config.LOG_FILE_PATH;
  }

  public get ACCESS_TOKEN_EXPIRY(): string {
    return this.config.ACCESS_TOKEN_EXPIRY;
  }

  public get REFRESH_TOKEN_EXPIRY(): string {
    return this.config.REFRESH_TOKEN_EXPIRY;
  }

  public get BCRYPT_ROUNDS(): number {
    return this.config.BCRYPT_ROUNDS;
  }
}
