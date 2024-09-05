// src/interfaces/ISSEService.ts

import { Response } from 'express';

export interface ISSEService {
  createConnection(id: string, res: Response): void;
  sendEvent(connectionId: string, event: string, data: any): void;
  endConnection(connectionId: string): void;
  handleClientDisconnection(connectionId: string): void;
}
