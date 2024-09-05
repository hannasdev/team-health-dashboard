// src/services/sse/SSEConnection.ts
import { Response } from 'express';
import { injectable, inject } from 'inversify';

import { TYPES } from '../../utils/types.js';
import { AppError } from '../errors';

import type {
  ILogger,
  IConfig,
  IEventEmitter,
  ISSEConnection,
} from '../../interfaces/index.js';

@injectable()
export class SSEConnection implements ISSEConnection {
  private isEnded: boolean = false;
  private timeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private sendEventListener: (event: string, data: any) => void;
  private endListener: () => void;
  private errorListener: (error: Error) => void;

  constructor(
    private id: string,
    private res: Response,
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.Config) private config: IConfig,
    @inject(TYPES.EventEmitter) private eventEmitter: IEventEmitter,
  ) {
    this.sendEventListener = this.handleSendEvent.bind(this);
    this.endListener = this.handleEnd.bind(this);
    this.errorListener = this.handleError.bind(this);

    this.setupSSE();
    this.setupTimeout();
    this.startHeartbeat();
    this.setupEventListeners();
  }

  private writeToResponse(data: string): void {
    if (!this.isEnded) {
      this.res.write(data);
    }
  }

  public sendEvent(event: string, data: any): void {
    if (!this.isEnded) {
      const dataString = JSON.stringify(data);
      this.writeToResponse(`event: ${event}\ndata: ${dataString}\n\n`);
      this.logger.debug(`Sent ${event} event for connection: ${this.id}`, {
        dataLength: dataString.length,
      });
    }
  }

  public end(): void {
    if (!this.isEnded) {
      this.stopHeartbeat();
      if (this.timeout) {
        clearTimeout(this.timeout);
        this.timeout = null;
      }
      this.isEnded = true;
      this.res.end();
      this.logger.info(`Connection ended: ${this.id}`);
      this.eventEmitter.removeListener(
        `sse:${this.id}:send`,
        this.sendEventListener,
      );
      this.eventEmitter.removeListener(`sse:${this.id}:end`, this.endListener);
      this.eventEmitter.removeListener(
        `sse:${this.id}:error`,
        this.errorListener,
      );
    }
  }

  public handleError(error: Error): void {
    this.logger.error(`Error in SSE connection ${this.id}:`, error);
    if (!this.isEnded) {
      this.stopHeartbeat();
      this.sendEvent('error', { message: error.message });
      this.end();
    }
  }

  private setupSSE(): void {
    this.res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    this.writeToResponse(':\n\n'); // Keep-alive
    this.logger.info(`SSE setup complete for connection: ${this.id}`);
  }

  private setupTimeout(): void {
    const timeoutDuration = this.config.SSE_TIMEOUT;
    this.timeout = setTimeout(() => {
      const timeoutError = new AppError(504, 'Operation timed out');
      this.logger.error(`Error in SSE connection ${this.id}:`, timeoutError);
      this.handleError(timeoutError);
    }, timeoutDuration);
  }

  private setupEventListeners(): void {
    this.eventEmitter.on(`sse:${this.id}:send`, this.sendEventListener);
    this.eventEmitter.on(`sse:${this.id}:end`, this.endListener);
    this.eventEmitter.on(`sse:${this.id}:error`, this.errorListener);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.sendEvent('heartbeat', { timestamp: new Date().toISOString() });
    }, this.config.HEARTBEAT_INTERVAL);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private handleSendEvent(event: string, data: any): void {
    this.sendEvent(event, data);
  }

  private handleEnd(): void {
    this.end();
  }
}
