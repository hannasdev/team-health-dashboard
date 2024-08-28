// src/interfaces/ISSEService.ts
import { Response } from 'express';

import { ProgressCallback } from '../types/index';

export interface ISSEService {
  initialize(res: Response): void;
  sendEvent(event: string, data: any): void;
  endResponse(): void;
  handleClientDisconnection(): void;
  progressCallback: ProgressCallback;
  handleError(error: Error): void;
  sendResultEvent(result: any): void;
}
