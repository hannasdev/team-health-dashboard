// src/__mocks__/mockMiddlewares/mockSecurityHeadersMiddleware.ts

import type { Request, Response, NextFunction } from 'express';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';

type TypedRequest = Request<
  ParamsDictionary,
  any,
  any,
  ParsedQs,
  Record<string, any>
>;

const createMockRequest = (
  overrides: Partial<TypedRequest> = {},
): Partial<TypedRequest> => {
  const getMock = jest.fn((name: string) => {
    if (name === 'set-cookie') return undefined;
    return name === 'user-agent' ? 'test-agent' : undefined;
  }) as TypedRequest['get'];

  return {
    method: 'GET',
    url: '/test',
    ip: '127.0.0.1',
    get: getMock,
    headers: {},
    ...overrides,
  };
};

export const createMockSecurityHeadersMiddleware = () => ({
  handle: jest.fn((req: Request, res: Response, next: NextFunction) => next()),
});

export { createMockRequest };
