// config/config.ts
import fs from 'fs';
import path from 'path';

import dotenv from 'dotenv';

import { AppError } from '../../utils/errors.js';

import type { IConfig } from '../../interfaces/index.js';

export class Config implements IConfig {
  private static instance: Config | null = null;

  private config: Omit<IConfig, 'getAllConfig'>;

  private constructor(
    env?: Partial<IConfig>,
    customEnvLoader?: () => NodeJS.ProcessEnv,
  ) {
    if (process.env.NODE_ENV === 'e2e' && !customEnvLoader) {
      this.loadEnvFile('.env.e2e');
    } else if (process.env.NODE_ENV !== 'test' && !customEnvLoader) {
      this.loadEnvFile('.env');
    }

    this.config = {
      ...this.loadDefaults(),
      ...Object.fromEntries(
        Object.entries(this.loadFromEnv(customEnvLoader)).filter(
          ([_, v]) => v !== undefined,
        ),
      ),
      ...env,
    } as Omit<IConfig, 'getAllConfig'>;

    this.validate();
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
              '# [optional, default: "15m"] Duration for access token validity (e.g., 15m, 1h, 1d).';
            break;
          case 'BCRYPT_ROUNDS':
            comment =
              '# [optional, default: 10] Number of bcrypt hashing rounds';
            break;
          case 'CORS_ORIGIN':
            comment =
              '# [optional, default: "*"] Allowed CORS origins (comma-separated list or "*" for all)';
            break;
          case 'DATABASE_URL':
            comment =
              '# [required, default: "insert-database-url-here"] MongoDB connection string';
            value = 'insert-database-url-here';
            break;
          case 'DATABASE_RETRY_DELAY':
            comment =
              '# [optional, default: 5000] Delay between MongoDB connection retries (in milliseconds)';
            break;
          case 'GOOGLE_SHEETS_CLIENT_EMAIL':
            comment =
              '# [required, default: "insert-client-email-here"] Google Sheets client email';
            value = 'insert-client-email-here';
            break;
          case 'GOOGLE_SHEETS_ID':
            comment =
              '# [required, default: "insert-google-sheets-id-here"] Google Sheets ID';
            value = 'insert-google-sheets-id-here';
            break;
          case 'GOOGLE_SHEETS_PRIVATE_KEY':
            comment =
              '# [required, default: "insert-private-key-here"] Google Sheets private key';
            value = 'insert-private-key-here';
            break;
          case 'JWT_SECRET':
            comment =
              '# [required, default: "insert-jwt-secret-here"]Secret key for JWT signing (change this to a secure random string)';
            value = 'insert-jwt-secret-here';
            break;
          case 'LOG_FILE_PATH':
            comment = '# [optional, default: "./logs"] Path to the log file';
            break;
          case 'LOG_FORMAT':
            comment =
              '# [optional, default: "combined"] Log format (e.g., "combined", "common", "dev", "short", "tiny")';
            break;
          case 'LOG_LEVEL':
            comment =
              '# [optional, default: "info"] Log level (e.g., "debug", "info", "warn", "error")';
            break;
          case 'MONGO_CONNECT_TIMEOUT_MS':
            comment =
              '# [optional, default: 30000] Timeout for MongoDB connection (in milliseconds)';
            break;
          case 'MONGO_SERVER_SELECTION_TIMEOUT_MS':
            comment =
              '# [optional, default: 30000] Timeout for MongoDB server selection (in milliseconds)';
            break;
          case 'PORT':
            comment =
              '# [optional, default: 3000] Port on which the server will listen';
            break;
          case 'REFRESH_TOKEN_EXPIRY':
            comment =
              '# [optional, default: "7d"] Duration for refresh token validity (e.g., 7d, 14d, 30d)';
            break;
          case 'REFRESH_TOKEN_SECRET':
            comment =
              '# [required, default: "insert-refresh-token-secret-here"] Secret key for JWT signing (change this to a secure random string)';
            value = 'insert-refresh-token-secret-here';
            break;
          case 'REPO_OWNER':
            comment =
              '# [required, default: "insert-repo-owner-here"] GitHub repository owner';
            value = 'insert-repo-owner-here';
            break;
          case 'REPO_REPO':
            comment =
              '# [required, default: "insert-repo-repo-here"] GitHub repository name';
            value = 'insert-repo-repo-here';
            break;
          case 'REPO_TOKEN':
            comment =
              '# [required, default: "insert-repo-token-here"] GitHub repository token';
            value = 'insert-repo-token-here';
            break;
        }
        return `${comment}\n${key}=${value}`;
      })
      .join('\n\n');

    const fullPath = path.resolve(process.cwd(), outputPath);
    fs.writeFileSync(fullPath, template);
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

  public static resetInstance(): void {
    Config.instance = null;
  }

  private loadDefaults(): Omit<IConfig, 'getAllConfig'> {
    return {
      ACCESS_TOKEN_EXPIRY: '15m',
      BCRYPT_ROUNDS: 10,
      CORS_ORIGIN: '*',
      DATABASE_URL: 'mongodb://localhost:27017/myapp',
      DATABASE_RETRY_DELAY: 5000,
      GOOGLE_SHEETS_CLIENT_EMAIL: 'insert-client-email-here',
      GOOGLE_SHEETS_ID: 'insert-google-sheets-id-here',
      GOOGLE_SHEETS_PRIVATE_KEY: 'insert-private-key-here',
      JWT_SECRET: 'insert-jwt-secret-here',
      LOG_FILE_PATH: './logs',
      LOG_FORMAT: 'json',
      LOG_LEVEL: 'info',
      MONGO_CONNECT_TIMEOUT_MS: 30000,
      MONGO_SERVER_SELECTION_TIMEOUT_MS: 30000,
      PORT: 3000,
      REFRESH_TOKEN_EXPIRY: '7d',
      REFRESH_TOKEN_SECRET: 'insert-refresh-token-secret-here',
      REPO_OWNER: 'insert-repo-owner-here',
      REPO_REPO: 'insert-repo-repo-here',
      REPO_TOKEN: 'insert-repo-token-here',
    };
  }

  private loadFromEnv(
    customEnvLoader?: () => NodeJS.ProcessEnv,
  ): Partial<IConfig> {
    const envVars = customEnvLoader ? customEnvLoader() : process.env;

    return {
      ACCESS_TOKEN_EXPIRY: envVars.ACCESS_TOKEN_EXPIRY,
      BCRYPT_ROUNDS: envVars.BCRYPT_ROUNDS
        ? parseInt(envVars.BCRYPT_ROUNDS, 10)
        : undefined,
      CORS_ORIGIN: envVars.CORS_ORIGIN,
      DATABASE_URL: envVars.DATABASE_URL,
      DATABASE_RETRY_DELAY: envVars.DATABASE_RETRY_DELAY
        ? parseInt(envVars.DATABASE_RETRY_DELAY, 10)
        : undefined,
      GOOGLE_SHEETS_CLIENT_EMAIL: envVars.GOOGLE_SHEETS_CLIENT_EMAIL,
      GOOGLE_SHEETS_ID: envVars.GOOGLE_SHEETS_ID,
      GOOGLE_SHEETS_PRIVATE_KEY: envVars.GOOGLE_SHEETS_PRIVATE_KEY,
      JWT_SECRET: envVars.JWT_SECRET,
      LOG_FILE_PATH: envVars.LOG_FILE_PATH,
      LOG_FORMAT: envVars.LOG_FORMAT,
      LOG_LEVEL: envVars.LOG_LEVEL,
      MONGO_CONNECT_TIMEOUT_MS: envVars.MONGO_CONNECT_TIMEOUT_MS
        ? parseInt(envVars.MONGO_CONNECT_TIMEOUT_MS, 10)
        : undefined,
      MONGO_SERVER_SELECTION_TIMEOUT_MS:
        envVars.MONGO_SERVER_SELECTION_TIMEOUT_MS
          ? parseInt(envVars.MONGO_SERVER_SELECTION_TIMEOUT_MS, 10)
          : undefined,
      PORT: envVars.PORT ? parseInt(envVars.PORT, 10) : undefined,
      REFRESH_TOKEN_EXPIRY: envVars.REFRESH_TOKEN_EXPIRY,
      REFRESH_TOKEN_SECRET: envVars.REFRESH_TOKEN_SECRET,
      REPO_OWNER: envVars.REPO_OWNER,
      REPO_REPO: envVars.REPO_REPO,
      REPO_TOKEN: envVars.REPO_TOKEN,
    };
  }

  private loadEnvFile(envFile: string = '.env'): void {
    // console.log(`Attempting to load ${envFile} file`);
    const envFilePath = path.resolve(process.cwd(), envFile);
    if (fs.existsSync(envFilePath)) {
      // console.log(`${envFile} file exists, calling dotenv.config`);
      dotenv.config({ path: envFilePath });
    } else {
      // console.log(`${envFile} file does not exist`);
    }
  }

  private validate(): void {
    const requiredEnvVars: (keyof Omit<IConfig, 'getAllConfig'>)[] = [
      'DATABASE_URL',
      'GOOGLE_SHEETS_CLIENT_EMAIL',
      'GOOGLE_SHEETS_ID',
      'GOOGLE_SHEETS_PRIVATE_KEY',
      'JWT_SECRET',
      'REFRESH_TOKEN_SECRET',
      'REPO_OWNER',
      'REPO_REPO',
      'REPO_TOKEN',
    ];

    const missingVars = requiredEnvVars.filter(
      varName => !this.config[varName as keyof typeof this.config],
    );

    if (missingVars.length > 0) {
      throw new AppError(
        500,
        `Missing required environment variables: ${missingVars.join(', ')}`,
      );
    }
  }

  public getAllConfig(): Omit<IConfig, 'getAllConfig'> {
    return { ...this.config };
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

  public get DATABASE_RETRY_DELAY(): number {
    return this.config.DATABASE_RETRY_DELAY;
  }

  public get MONGO_CONNECT_TIMEOUT_MS(): number {
    return this.config.MONGO_CONNECT_TIMEOUT_MS;
  }

  public get MONGO_SERVER_SELECTION_TIMEOUT_MS(): number {
    return this.config.MONGO_SERVER_SELECTION_TIMEOUT_MS;
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
