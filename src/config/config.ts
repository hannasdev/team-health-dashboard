// config/config.ts
import dotenv from 'dotenv';

import { IConfig } from '../interfaces/index.js';

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
    dotenv.config(); // Load .env file if present
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

  private loadDefaults(): IConfig {
    return {
      GOOGLE_SHEETS_CLIENT_EMAIL: '',
      GOOGLE_SHEETS_PRIVATE_KEY: '',
      GOOGLE_SHEETS_ID: '',
      GITHUB_TOKEN: '',
      GITHUB_OWNER: '',
      GITHUB_REPO: '',
      PORT: 3000,
      CORS_ORIGIN: '*',
      JWT_SECRET: 'your-secret-key', // Provide a safe default
      DATABASE_URL: 'mongodb://localhost:27017/team-health-dashboard',
      MONGO_CONNECT_TIMEOUT_MS: 5000,
      MONGO_SERVER_SELECTION_TIMEOUT_MS: 5000,
      LOG_LEVEL: 'info',
      LOG_FORMAT: 'json',
      LOG_FILE_PATH: './logs',
    };
  }

  private loadFromEnv(): Partial<IConfig> {
    return {
      GOOGLE_SHEETS_CLIENT_EMAIL: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      GOOGLE_SHEETS_PRIVATE_KEY: process.env.GOOGLE_SHEETS_PRIVATE_KEY,
      GOOGLE_SHEETS_ID: process.env.GOOGLE_SHEETS_ID,
      GITHUB_TOKEN: process.env.GITHUB_TOKEN,
      GITHUB_OWNER: process.env.GITHUB_OWNER,
      GITHUB_REPO: process.env.GITHUB_REPO,
      PORT: parseInt(process.env.PORT || '3000', 10),
      CORS_ORIGIN: process.env.CORS_ORIGIN,
      JWT_SECRET: process.env.JWT_SECRET,
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

  public get GITHUB_TOKEN(): string {
    return this.config.GITHUB_TOKEN;
  }

  public get GITHUB_OWNER(): string {
    return this.config.GITHUB_OWNER;
  }

  public get GITHUB_REPO(): string {
    return this.config.GITHUB_REPO;
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

  private validate(): void {
    const requiredEnvVars: (keyof IConfig)[] = [
      'GOOGLE_SHEETS_CLIENT_EMAIL',
      'GOOGLE_SHEETS_PRIVATE_KEY',
      'GOOGLE_SHEETS_ID',
      'GITHUB_TOKEN',
      'GITHUB_OWNER',
      'GITHUB_REPO',
      'JWT_SECRET',
    ];

    requiredEnvVars.forEach(varName => {
      if (!this.config[varName]) {
        throw new Error(`Environment variable ${varName} is not set`);
      }
    });
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
}
