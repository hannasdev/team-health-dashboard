// src/interfaces/middleware/IEnhancedRequest.ts
import type { IncomingHttpHeaders } from 'http';
import type { Request } from 'express';

export interface IEnhancedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    [key: string]: any;
  };
  originalUrl: string;
  url?: string;
  ip: string;
  method: string;
  path: string;
  headers: IncomingHttpHeaders;
  socket: { remoteAddress: string };
  get(header: string): string | undefined;
  body?: any;
}
