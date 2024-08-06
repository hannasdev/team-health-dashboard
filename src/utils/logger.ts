// src/utils/Logger.ts
import path from 'path';

import { injectable, inject } from 'inversify';
import winston from 'winston';

import { config } from '@/config/config';
import { ILogger } from '@/interfaces/ILogger';
import { TYPES } from '@/utils/types';

@injectable()
export class Logger implements ILogger {
  private logger: winston.Logger;

  constructor(
    @inject(TYPES.LogLevel) private logLevel: string,
    @inject(TYPES.LogFormat) private logFormat: string,
  ) {
    this.logger = winston.createLogger({
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
          filename: path.join(config.LOG_FILE_PATH, 'error.log'),
          level: 'error',
        }),
        new winston.transports.File({
          filename: path.join(config.LOG_FILE_PATH, 'combined.log'),
        }),
      ],
    });
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.logger.info(message, meta);
  }

  error(message: string, error?: Error, meta?: Record<string, unknown>): void {
    this.logger.error(message, { error, ...meta });
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.logger.warn(message, meta);
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.logger.debug(message, meta);
  }
}
