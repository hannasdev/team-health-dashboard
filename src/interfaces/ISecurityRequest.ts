import { Request } from 'express';

export interface ISecurityRequest {
  method: string;
  path: string;
  ip: string;
  get(name: string): string | undefined;
  user?: {
    id: string;
    [key: string]: any;
  };
}

export type SecurityRequestData = Pick<Request, 'method' | 'ip' | 'get'> & {
  path: string;
  user?: {
    id: string;
    [key: string]: any;
  };
};
