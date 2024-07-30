// src/utils/logger.ts
import { injectable } from 'inversify';

@injectable()
export class Logger {
  info(message: string): void {
    console.log(`[INFO] ${message}`);
  }

  error(message: string, error?: Error): void {
    console.error(`[ERROR] ${message}`, error);
  }

  warn(message: string): void {
    console.warn(`[WARN] ${message}`);
  }
}
