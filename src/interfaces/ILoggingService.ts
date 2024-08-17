// src/interfaces/ILoggingService.ts

export interface ILoggingService {
  /**
   * Log an info message
   * @param message The message to log
   * @param meta Optional metadata to include with the log
   */
  info(message: string, meta?: Record<string, unknown>): void;

  /**
   * Log an error message
   * @param message The error message to log
   * @param error Optional Error object
   * @param meta Optional metadata to include with the log
   */
  error(message: string, error?: Error, meta?: Record<string, unknown>): void;

  /**
   * Log a warning message
   * @param message The warning message to log
   * @param meta Optional metadata to include with the log
   */
  warn(message: string, meta?: Record<string, unknown>): void;

  /**
   * Log a debug message
   * @param message The debug message to log
   * @param meta Optional metadata to include with the log
   */
  debug(message: string, meta?: Record<string, unknown>): void;

  /**
   * Log a message with a custom log level
   * @param level The log level
   * @param message The message to log
   * @param meta Optional metadata to include with the log
   */
  log(level: string, message: string, meta?: Record<string, unknown>): void;
}
