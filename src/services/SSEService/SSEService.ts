// src/utils/SSEService/SSEService.ts
// src/services/sse/SSEService.ts
import { Response } from 'express';
import { inject, injectable } from 'inversify';

import { AppError } from '../../utils/errors.js';
import { TYPES } from '../../utils/types.js';
import { SSEConnection } from '../SSEConnection/SSEConnection.js';

import type {
  ILogger,
  IConfig,
  IEventEmitter,
  ISSEService,
} from '../../interfaces/index.js';

@injectable()
export class SSEService implements ISSEService {
  private connections: Map<string, SSEConnection> = new Map();

  constructor(
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.Config) private config: IConfig,
    @inject(TYPES.EventEmitter) private eventEmitter: IEventEmitter,
  ) {}

  public createConnection(id: string, res: Response): void {
    if (this.connections.has(id)) {
      throw new AppError(400, 'Connection already exists');
    }

    const connection = new SSEConnection(
      id,
      res,
      this.logger,
      this.config,
      this.eventEmitter,
    );
    this.connections.set(id, connection);
    this.logger.info(`SSE connection created: ${id}`);
  }

  public sendEvent(connectionId: string, event: string, data: any): void {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new AppError(404, 'Connection not found');
    }
    connection.sendEvent(event, data);
  }

  public endConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.end();
      this.connections.delete(connectionId);
      this.logger.info(`SSE connection ended: ${connectionId}`);
    }
  }

  public handleClientDisconnection(connectionId: string): void {
    this.endConnection(connectionId);
  }
}
