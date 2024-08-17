import { injectable, inject } from 'inversify';

import { ILogger, ILoggingService } from '../../interfaces/index.js';
import { TYPES } from '../../utils/types.js';

@injectable()
export class LoggingService implements ILoggingService {
  constructor(@inject(TYPES.Logger) private logger: ILogger) {}

  info(message: string, meta?: Record<string, unknown>): void {
    this.logger.info(message, meta);
  }

  error(message: string, error?: Error, meta?: Record<string, unknown>): void {
    this.logger.error(message, error, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.logger.warn(message, meta);
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.logger.debug(message, meta);
  }

  log(level: string, message: string, meta?: Record<string, unknown>): void {
    (this.logger as any)[level](message, meta);
  }
}
