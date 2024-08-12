// src/services/progress/ProgressTracker.ts
import { inject, injectable } from 'inversify';

import { IProgressTracker } from '../../interfaces/IProgressTracker.js';
import type { Logger } from '../../utils/Logger.js';
import { TYPES } from '../../utils/types.js';

@injectable()
export class ProgressTracker implements IProgressTracker {
  private lastReportTime: number = 0;
  private reportInterval: number = 1000; // 1 second

  constructor(@inject(TYPES.Logger) private logger: Logger) {}

  trackProgress(current: number, total: number, message: string): void {
    const now = Date.now();
    if (now - this.lastReportTime >= this.reportInterval || current === total) {
      const progress = Math.min((current / total) * 100, 100);
      this.logger.info(
        `${message} - Progress: ${progress.toFixed(2)}% (${current}/${total})`,
      );
      this.lastReportTime = now;
    }
  }

  setReportInterval(interval: number): void {
    this.reportInterval = interval;
  }
}

export interface ProgressCallback {
  (current: number, total: number, message: string): void;
}

export function createProgressCallback(
  tracker: IProgressTracker,
): ProgressCallback {
  return (current: number, total: number, message: string) => {
    tracker.trackProgress(current, total, message);
  };
}
