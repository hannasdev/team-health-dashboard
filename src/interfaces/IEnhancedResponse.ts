// src/interfaces/middleware/IEnhancedResponse.ts
import type { Response } from 'express';

export interface CookieOptions {
  maxAge?: number;
  signed?: boolean;
  expires?: Date | number;
  httpOnly?: boolean;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: boolean | 'lax' | 'strict' | 'none';
}

export interface IEnhancedResponse extends Response {
  setHeader(name: string, value: string | number | readonly string[]): this;
  status(code: number): this;
  json(body: any): this;
  send(body: any): this;
  cookie(name: string, value: string | object, options?: CookieOptions): this;
}
