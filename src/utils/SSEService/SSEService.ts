// src/utils/SSEService/SSEService.ts
import { Response } from 'express';
import { injectable, inject } from 'inversify';

import { ProgressCallback } from '../../types/index.js';
import { AppError } from '../errors.js';
import { TYPES } from '../types.js';

import type {
  ILogger,
  ISSEService,
  IProgressTracker,
  IConfig,
  IApiResponse,
  IEventEmitter,
} from '../../interfaces/index.js';

@injectable()
export class SSEService implements ISSEService {
  private isResponseEnded: boolean = false;
  private res: Response | null = null;
  private timeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private heartbeatIntervalDuration: number;

  constructor(
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.ProgressTracker) private progressTracker: IProgressTracker,
    @inject(TYPES.Config) private config: IConfig,
    @inject(TYPES.ApiResponse) private apiResponse: IApiResponse,
    @inject(TYPES.EventEmitter) private eventEmitter: IEventEmitter,
  ) {
    this.heartbeatIntervalDuration = this.config.HEARTBEAT_INTERVAL;
  }

  public initialize(res: Response): void {
    this.res = res;
    this.setupSSE();
    this.setupTimeout();
    this.startHeartbeat();
    this.setupEventListeners();
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

  private setupEventListeners(): void {
    this.eventEmitter.on('sendEvent', this.handleSendEvent.bind(this));
    this.eventEmitter.on('endResponse', this.endResponse.bind(this));
    this.eventEmitter.on('error', this.handleError.bind(this));
  }

  private emitEvent(event: string, data: any): void {
    if (!this.res) {
      throw new Error('SSEService not initialized with a Response object');
    }
    if (!this.isResponseEnded) {
      const dataString = data !== undefined ? JSON.stringify(data) : '';
      this.res.write(`event: ${event}\ndata: ${dataString}\n\n`);
      this.logger.debug(`Sent ${event} event`, {
        dataLength: dataString.length,
      });
    }
  }

  private handleSendEvent(event: string, data: any): void {
    this.emitEvent(event, data);
  }

  public sendEvent(event: string, data: any): void {
    this.logger.debug(`sendEvent: ${event}: ${data}`);
    this.eventEmitter.emit('sendEvent', event, data);
  }

  public endResponse(): void {
    if (!this.res) {
      throw new Error('SSEService not initialized with a Response object');
    }
    if (!this.isResponseEnded) {
      this.stopHeartbeat(); // CHANGED: Stop heartbeat before ending response
      if (this.timeout) {
        clearTimeout(this.timeout);
        this.timeout = null;
      }
      this.res.end();
      this.isResponseEnded = true;
      this.logger.info('Response ended');
      this.cleanup();
    }
  }

  public handleClientDisconnection = (): void => {
    this.logger.info('Client disconnected');
    this.endResponse();
  };

  public progressCallback: ProgressCallback = (
    current: number,
    total: number,
    message: string,
  ) => {
    const progress = Math.min(Math.round((current / total) * 100), 100);
    this.progressTracker.trackProgress(current, total, message);
    this.eventEmitter.emit('sendEvent', 'progress', {
      progress,
      message,
      current,
      total,
    });
  };

  public handleError(error: Error): void {
    this.logger.error('Error in SSEService:', error);
    if (!this.isResponseEnded) {
      this.stopHeartbeat(); // Stop heartbeat explicitly
      this.eventEmitter.emit(
        'sendEvent',
        'error',
        this.apiResponse.createErrorResponse(
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
      if (!this.isResponseEnded) {
        const response = this.apiResponse.createSuccessResponse({
          metrics: result.metrics,
          errors: result.errors,
          githubStats: result.githubStats,
          status: result.errors.length > 0 ? 207 : 200,
        });
        this.eventEmitter.emit('sendEvent', 'result', response);
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
    }
  }

  public triggerHeartbeat(): void {
    this.logger.debug('Heartbeat Sent');
    this.eventEmitter.emit('sendEvent', 'heartbeat', {
      timestamp: new Date().toISOString(),
    });
  }

  private startHeartbeat(): void {
    this.logger.debug('Start heartbeat');
    this.heartbeatInterval = setInterval(() => {
      this.eventEmitter.emit('sendEvent', 'heartbeat', {
        timestamp: new Date().toISOString(),
      });
    }, this.heartbeatIntervalDuration);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      this.logger.debug('Stopped heartbeat');
    }
  }

  private cleanup(): void {
    this.stopHeartbeat();
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    this.logger.debug('Cleanup finished');
    // Add any other cleanup operations here
  }
}
