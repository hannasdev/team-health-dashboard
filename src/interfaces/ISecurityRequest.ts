import { Request } from 'express';

export interface ISecurityRequest extends Request {
  method: string;
  path: string;
  url?: string;
  ip: string;
  socket: { remoteAddress: string };
  get?(header: string): string | undefined;
  body?: any;
  user?: any;
}

export type SecurityRequestData = Pick<Request, 'method' | 'ip' | 'get'> & {
  path: string;
  user?: {
    id: string;
    [key: string]: any;
  };
};
