import fs from 'fs';
import path from 'path';

import { injectable, inject } from 'inversify';
import winston from 'winston';

import { serializeError } from '../../utils/errorUtils.js';
import { TYPES } from '../../utils/types.js';

import type { IConfig } from '../../interfaces/IConfig.js';
import type { ILogger } from '../../interfaces/ILogger.js';

@injectable()
export class Logger implements ILogger {
  private logger: winston.Logger | Console;

  constructor(
    @inject(TYPES.LogLevel) private logLevel: string,
    @inject(TYPES.LogFormat) private logFormat: string,
    @inject(TYPES.Config) private config: IConfig,
  ) {
    this.logger = this.createLogger();
  }

  private createLogger(): winston.Logger | Console {
    if (process.env.NODE_ENV === 'test') {
      return console;
    }

    const logDir = this.config.LOG_FILE_PATH || './logs';
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const errorLogPath = path.join(logDir, 'error.log');
    const combinedLogPath = path.join(logDir, 'combined.log');

    const validFormats = ['json', 'simple'];
    const format = validFormats.includes(this.logFormat)
      ? this.logFormat
      : 'json';

    return winston.createLogger({
      level: this.logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        format === 'json' ? winston.format.json() : winston.format.simple(),
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          filename: errorLogPath,
          level: 'error',
        }),
        new winston.transports.File({
          filename: combinedLogPath,
        }),
      ],
    });
  }

  private safeStringify(obj: any): string {
    const getCircularReplacer = () => {
      const seen = new WeakSet();
      return (key: string, value: any) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular Reference]';
          }
          seen.add(value);
          // Handle circular references in nested objects
          const newObj: any = Array.isArray(value) ? [] : {};
          Object.keys(value).forEach(k => {
            newObj[k] = value[k];
          });
          return newObj;
        }
        return value;
      };
    };

    try {
      return JSON.stringify(obj, getCircularReplacer());
    } catch (error) {
      return JSON.stringify({ error: 'Unable to stringify object' });
    }
  }

  info(message: string, meta?: Record<string, unknown>): void {
    if (process.env.NODE_ENV === 'test') {
      try {
        console.log(
          this.safeStringify({ level: 'info', message, ...(meta || {}) }),
        );
      } catch (error) {
        console.log(
          this.safeStringify({
            level: 'info',
            message,
            meta: '[Unable to serialize meta]',
          }),
        );
      }
    } else {
      (this.logger as winston.Logger).info(message, meta);
    }
  }

  error(message: string, error?: Error, meta?: Record<string, unknown>): void {
    const serializedError = error ? serializeError(error) : undefined;
    if (process.env.NODE_ENV === 'test') {
      try {
        console.log(
          this.safeStringify({
            level: 'error',
            message,
            error: serializedError,
            ...(meta || {}),
          }),
        );
      } catch (err) {
        console.log(
          this.safeStringify({
            level: 'error',
            message,
            error: '[Unable to serialize error]',
            meta: '[Unable to serialize meta]',
          }),
        );
      }
    } else {
      (this.logger as winston.Logger).error(message, {
        error: serializedError,
        ...meta,
      });
    }
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    if (process.env.NODE_ENV === 'test') {
      try {
        console.log(
          this.safeStringify({ level: 'warn', message, ...(meta || {}) }),
        );
      } catch (error) {
        console.log(
          this.safeStringify({
            level: 'warn',
            message,
            meta: '[Unable to serialize meta]',
          }),
        );
      }
    } else {
      (this.logger as winston.Logger).warn(message, meta);
    }
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    if (process.env.NODE_ENV === 'test') {
      try {
        console.log(
          this.safeStringify({ level: 'debug', message, ...(meta || {}) }),
        );
      } catch (error) {
        console.log(
          this.safeStringify({
            level: 'debug',
            message,
            meta: '[Unable to serialize meta]',
          }),
        );
      }
    } else {
      (this.logger as winston.Logger).debug(message, meta);
    }
  }
}
