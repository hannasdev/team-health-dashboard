import { Response } from 'express';

export interface ISecurityResponse extends Response {
  setHeader(name: string, value: string | number | readonly string[]): this;
  status(code: number): this;
  end(): this;
}
