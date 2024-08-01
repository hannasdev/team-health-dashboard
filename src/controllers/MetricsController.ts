// src/controllers/MetricsController.ts
import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '../utils/types';
import type {
  IMetricsService,
  ProgressCallback,
} from '../interfaces/IMetricsService';
import type { IMetric } from '../interfaces/IMetricModel';
import { Logger } from '../utils/logger';

@injectable()
export class MetricsController {
  constructor(
    @inject(TYPES.MetricsService) private metricsService: IMetricsService,
    @inject(TYPES.Logger) private logger: Logger,
  ) {}

  public getAllMetrics = async (req: Request, res: Response): Promise<void> => {
    const sendEvent = (event: string, data: any) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    let githubPagesFetched = 0;
    let totalGithubPages = 1; // Initial estimate, will be updated

    const calculateProgress = (
      serviceProgress: number,
      service: 'sheets' | 'github',
    ): number => {
      if (service === 'sheets') {
        return serviceProgress * 0.4; // Google Sheets accounts for 40% of total progress
      } else {
        // GitHub accounts for 60% of total progress
        const githubProgress = (githubPagesFetched / totalGithubPages) * 100;
        return 40 + githubProgress * 0.6;
      }
    };

    try {
      const result = await this.metricsService.getAllMetrics(
        (progress: number, message: string, details?: Record<string, any>) => {
          let overallProgress: number;

          if (message.startsWith('Google Sheets:')) {
            overallProgress = calculateProgress(progress, 'sheets');
          } else if (message.startsWith('GitHub:')) {
            if (details && 'currentPage' in details) {
              githubPagesFetched = details.currentPage;
              totalGithubPages = Math.max(
                totalGithubPages,
                details.totalPages || 1,
              );
            }
            overallProgress = calculateProgress(progress, 'github');
          } else {
            overallProgress = progress;
          }

          sendEvent('progress', {
            progress: Math.min(Math.round(overallProgress), 100),
            message,
            ...details,
          });
        },
      );

      sendEvent('result', {
        success: true,
        data: result.metrics,
        errors: result.errors,
        status: result.errors.length > 0 ? 207 : 200,
      });
    } catch (error) {
      this.logger.error('Error in MetricsController:', error as Error);
      sendEvent('error', {
        success: false,
        errors: [
          {
            source: 'MetricsController',
            message:
              error instanceof Error
                ? error.message
                : 'An unknown error occurred',
          },
        ],
        status: 500,
      });
    }
  };
}
