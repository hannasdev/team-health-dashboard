// src/utils/Logger/Logger.ts
import fs from 'fs';
import path from 'path';

import { injectable, inject } from 'inversify';
import winston from 'winston';

import { TYPES } from '../../utils/types.js';
import { serializeError } from '../errorUtils.js';

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

    return winston.createLogger({
      level: this.logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        this.logFormat === 'json'
          ? winston.format.json()
          : winston.format.simple(),
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

  info(message: string, meta?: Record<string, unknown>): void {
    if (process.env.NODE_ENV === 'test') {
      console.log(JSON.stringify({ level: 'info', message, ...meta }));
    } else {
      (this.logger as winston.Logger).info(message, meta);
    }
  }

  error(message: string, error?: Error, meta?: Record<string, unknown>): void {
    const serializedError = error ? serializeError(error) : undefined;
    if (process.env.NODE_ENV === 'test') {
      console.log(
        JSON.stringify({
          level: 'error',
          message,
          error: serializedError,
          ...meta,
        }),
      );
    } else {
      (this.logger as winston.Logger).error(message, {
        error: serializedError,
        ...meta,
      });
    }
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    if (process.env.NODE_ENV === 'test') {
      console.log(JSON.stringify({ level: 'warn', message, ...meta }));
    } else {
      (this.logger as winston.Logger).warn(message, meta);
    }
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    if (process.env.NODE_ENV === 'test') {
      console.log(JSON.stringify({ level: 'debug', message, ...meta }));
    } else {
      (this.logger as winston.Logger).debug(message, meta);
    }
  }
}
