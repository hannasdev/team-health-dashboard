// src/utils/Logger.ts
import fs from 'fs';
import path from 'path';

import { injectable, inject } from 'inversify';
import winston from 'winston';

import { Config } from '../../config/config.js';
import { TYPES } from '../../utils/types.js';

import type { ILogger } from '../../interfaces/ILogger.js';

const config = Config.getInstance();

@injectable()
export class Logger implements ILogger {
  private logger: winston.Logger;

  constructor(
    @inject(TYPES.LogLevel) private logLevel: string,
    @inject(TYPES.LogFormat) private logFormat: string,
  ) {
    const logDir = config.LOG_FILE_PATH || './logs';

    // Ensure the log directory exists
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const errorLogPath = path.join(logDir, 'error.log');
    const combinedLogPath = path.join(logDir, 'combined.log');

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
          filename: errorLogPath,
          level: 'error',
        }),
        new winston.transports.File({
          filename: combinedLogPath,
        }),
      ],
    });

    this.debug('Logger initialized', {
      logLevel: this.logLevel,
      logFormat: this.logFormat,
      logDir,
      errorLogPath,
      combinedLogPath,
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
