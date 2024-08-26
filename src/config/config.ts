// config/config.ts
import fs from 'fs';
import path from 'path';

import dotenv from 'dotenv';

import { AppError } from '../utils/errors.js';

import type { IConfig } from '../interfaces/index.js';

/**
 * @class Config
 * @implements {IConfig}
 * @description Singleton class for managing application configuration.
 * Loads configuration from environment variables and provides default values.
 *
 * @example
 * const config = Config.getInstance();
 * console.log(config.DATABASE_URL);
 *
 * @example
 * // Override config for testing
 * const testConfig = Config.getInstance({ DATABASE_URL: 'mongodb://localhost:27017/test_db' });
 */
export class Config implements IConfig {
  private static instance: Config | null = null;

  private config: IConfig;

  /**
   * @private
   * @constructor
   * @param {Partial<IConfig>} [env] - Optional partial configuration to override defaults and environment variables.
   */
  private constructor(env?: Partial<IConfig>) {
    this.loadEnvFile();
    this.config = {
      ...this.loadDefaults(),
      ...this.loadFromEnv(),
      ...env, // Override with provided env
    };
    this.validate();
  }

  /**
   * @static
   * @method getInstance
   * @param {Partial<IConfig>} [env] - Optional partial configuration to override defaults and environment variables.
   * @returns {Config} The singleton instance of the Config class.
   * @description Gets or creates the singleton instance of the Config class.
   */
  public static getInstance(env?: Partial<IConfig>): Config {
    if (!Config.instance) {
      Config.instance = new Config(env);
    }
    return Config.instance;
  }

  private loadEnvFile(): void {
    const envPath = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
    const envFilePath = path.resolve(process.cwd(), envPath);

    if (fs.existsSync(envFilePath)) {
      dotenv.config({ path: envFilePath });
    }
  }

  private loadDefaults(): IConfig {
    return {
      GOOGLE_SHEETS_CLIENT_EMAIL: '',
      GOOGLE_SHEETS_PRIVATE_KEY: '',
      GOOGLE_SHEETS_ID: '',
      REPO_TOKEN: '',
      REPO_OWNER: '',
      REPO_REPO: '',
      PORT: 3000,
      CORS_ORIGIN: '*',
      JWT_SECRET: 'your-secret-key', // Provide a safe default
      REFRESH_TOKEN_SECRET: 'refresh-token-key',
      DATABASE_URL: 'mongodb://localhost:27017/team-health-dashboard',
      MONGO_CONNECT_TIMEOUT_MS: 10000,
      MONGO_SERVER_SELECTION_TIMEOUT_MS: 10000,
      LOG_LEVEL: 'info',
      LOG_FORMAT: 'json',
      LOG_FILE_PATH: './logs',
      ACCESS_TOKEN_EXPIRY: '15m',
      REFRESH_TOKEN_EXPIRY: '7d',
      BCRYPT_ROUNDS: 10,
    };
  }

  private loadFromEnv(): Partial<IConfig> {
    return {
      GOOGLE_SHEETS_CLIENT_EMAIL: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      GOOGLE_SHEETS_PRIVATE_KEY: process.env.GOOGLE_SHEETS_PRIVATE_KEY,
      GOOGLE_SHEETS_ID: process.env.GOOGLE_SHEETS_ID,
      REPO_TOKEN: process.env.REPO_TOKEN,
      REPO_OWNER: process.env.REPO_OWNER,
      REPO_REPO: process.env.REPO_REPO,
      PORT: parseInt(process.env.PORT || '3000', 10),
      CORS_ORIGIN: process.env.CORS_ORIGIN,
      JWT_SECRET: process.env.JWT_SECRET,
      REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
      DATABASE_URL: process.env.DATABASE_URL,
      MONGO_CONNECT_TIMEOUT_MS: parseInt(
        process.env.MONGO_CONNECT_TIMEOUT_MS || '5000',
        10,
      ),
      MONGO_SERVER_SELECTION_TIMEOUT_MS: parseInt(
        process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || '5000',
        10,
      ),
      LOG_LEVEL: process.env.LOG_LEVEL,
      LOG_FORMAT: process.env.LOG_FORMAT,
      LOG_FILE_PATH: process.env.LOG_FILE_PATH,
    };
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

  /**
   * @static
   * @method resetInstance
   * @description Resets the singleton instance. Primarily used for testing purposes.
   * @warning This method should be used with caution, especially in production environments.
   */
  public static resetInstance(): void {
    Config.instance = null;
  }

  public getAllConfig(): IConfig {
    return { ...this.config };
  }
}
