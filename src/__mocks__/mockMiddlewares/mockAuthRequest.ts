import { IncomingHttpHeaders } from 'http';

import { Request, Response } from 'express';

import type { IAuthRequest } from '../../interfaces/index.js';

export function createMockAuthRequest(
  overrides: Partial<IAuthRequest> = {},
): IAuthRequest {
  return {
    headers: {},
    query: {},
    ...overrides,
    user: overrides.user || null,
  } as IAuthRequest;
}

export function createMockExpressRequest(
  overrides: Partial<Request> = {},
): Request {
  const req: Partial<Request> = {
    headers: {} as IncomingHttpHeaders,
    ...overrides,
  };
  return req as Request;
}

export function createMockResponse(): jest.Mocked<Response> {
  const res: Partial<Response> = {
    append: jest.fn().mockReturnThis(),
    attachment: jest.fn().mockReturnThis(),
    charset: '',
    clearCookie: jest.fn().mockReturnThis(),
    contentType: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    download: jest.fn(),
    format: jest.fn(),
    get: jest.fn(),
    header: jest.fn().mockReturnThis(),
    headersSent: false,
    links: jest.fn().mockReturnThis(),
    locals: {},
    location: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
    render: jest.fn(),
    set: jest.fn().mockReturnThis(),
    type: jest.fn().mockReturnThis(),
    vary: jest.fn().mockReturnThis(),
    write: jest.fn().mockReturnThis(),
    writeHead: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    sendStatus: jest.fn().mockReturnThis(),
    on: jest.fn(),
    once: jest.fn(),
    emit: jest.fn(),
    removeListener: jest.fn(),
    setHeader: jest.fn(),
  };

  return res as jest.Mocked<Response>;
}

export function createMockAuthMiddlewareResponse() {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
  };
  return res;
}

export function createMockMetricsRequest(
  overrides: Partial<Request> = {},
): Request {
  const mockRequest = {
    accepts: jest.fn(),
    acceptsCharsets: jest.fn(),
    acceptsEncodings: jest.fn(),
    acceptsLanguages: jest.fn(),
    app: {} as any,
    baseUrl: '',
    body: {},
    cookies: {},
    fresh: false,
    get: jest.fn(),
    header: jest.fn(),
    hostname: '',
    ip: '127.0.0.1',
    ips: [],
    is: jest.fn(),
    method: 'GET',
    originalUrl: '',
    on: jest.fn(),
    params: {},
    path: '',
    protocol: 'http',
    query: {},
    range: jest.fn(),
    route: {} as any,
    secure: false,
    signedCookies: {},
    stale: false,
    subdomains: [],
    user: {
      id: '123',
      email: 'test@example.com',
      exp: Math.floor(Date.now() / 1000) + 3600,
    },
    xhr: false,
    ...overrides,
  } as Request;

  return mockRequest;
}
