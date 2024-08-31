// src/services/SSEService.ts
import { Response } from 'express';
import { injectable, inject } from 'inversify';

import { ProgressCallback } from '../../types/index.js';
import { createErrorResponse } from '../../utils/ApiResponse/ApiResponse.js';
import { AppError } from '../errors.js';
import { TYPES } from '../types.js';

import type {
  ILogger,
  ISSEService,
  IProgressTracker,
  IConfig,
} from '../../interfaces/index.js';

@injectable()
export class SSEService implements ISSEService {
  private isClientConnected: boolean = true;
  private isResponseEnded: boolean = false;
  private res: Response | null = null;
  private timeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.ProgressTracker) private progressTracker: IProgressTracker,
    @inject(TYPES.Config) private config: IConfig,
  ) {}

  public initialize(res: Response): void {
    this.res = res;
    this.setupSSE();
    this.setupTimeout();
    this.startHeartbeat();
  }

  private setupSSE(): void {
    if (!this.res) {
      throw new Error('SSEService not initialized with a Response object');
    }
    this.res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    this.res.write(':\n\n');
    this.logger.info('SSE setup complete');
  }

  private setupTimeout(): void {
    const timeoutDuration = this.config.SSE_TIMEOUT;
    this.timeout = setTimeout(() => {
      const timeoutError = new AppError(504, 'Operation timed out');
      this.handleError(timeoutError);
    }, timeoutDuration);
  }

  public sendEvent(event: string, data: any): void {
    if (!this.res) {
      throw new Error('SSEService not initialized with a Response object');
    }
    if (this.isClientConnected && !this.isResponseEnded) {
      const dataString = data !== undefined ? JSON.stringify(data) : '';
      this.res.write(`event: ${event}\ndata: ${dataString}\n\n`);
      this.logger.debug(`Sent ${event} event`, {
        dataLength: dataString.length,
      });
    }
  }

  public endResponse(): void {
    if (!this.res) {
      throw new Error('SSEService not initialized with a Response object');
    }
    if (!this.isResponseEnded) {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
      }
      this.res.end();
      this.isResponseEnded = true;
      this.logger.info('Response ended');
      this.cleanup();
    }
  }

  public handleClientDisconnection = (): void => {
    this.isClientConnected = false;
    this.logger.info('Client disconnected');
    this.endResponse();
  };

  public progressCallback: ProgressCallback = (current, total, message) => {
    const progress = Math.min(Math.round((current / total) * 100), 100);
    this.progressTracker.trackProgress(current, total, message);
    this.sendEvent('progress', { progress, message, current, total });
  };

  public handleError(error: Error): void {
    this.logger.error('Error in SSEService:', error);
    if (this.isClientConnected && !this.isResponseEnded) {
      this.sendEvent(
        'error',
        createErrorResponse(
          error instanceof AppError
            ? error.message
            : 'An unexpected error occurred',
          error instanceof AppError ? error.statusCode : 500,
        ),
      );
      this.logger.error('Sent error event to client');
    }
    this.endResponse();
  }

  public sendResultEvent(result: any): void {
    try {
      if (this.isClientConnected && !this.isResponseEnded) {
        this.sendEvent('result', {
          success: true,
          data: result.metrics,
          errors: result.errors,
          githubStats: result.githubStats,
          status: result.errors.length > 0 ? 207 : 200,
        });
        this.logger.info('Metrics fetched and sent successfully', {
          metricsCount: result.metrics.length,
          errorsCount: result.errors.length,
        });
      }
    } catch (error) {
      this.logger.error('Error sending result event:', error as Error);
      this.handleError(
        error instanceof Error ? error : new Error('Unknown error occurred'),
      );
    } finally {
      this.endResponse();
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.sendEvent('heartbeat', { timestamp: new Date().toISOString() });
    }, 15000); // Send heartbeat every 15 seconds
  }

  private cleanup(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    // Add any other cleanup operations here
  }
}
