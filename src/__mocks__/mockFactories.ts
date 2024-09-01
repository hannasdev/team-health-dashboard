// @/__mocks__/mockFactories.ts
import { IncomingHttpHeaders } from 'http';

import { Request, Response } from 'express';

import type { IAuthRequest, IConfig, IMetric } from '../interfaces/index.js';

export function createMockConfig(): jest.Mocked<IConfig> {
  return {
    GOOGLE_SHEETS_CLIENT_EMAIL: 'google_sheets_client_email_test',
    GOOGLE_SHEETS_PRIVATE_KEY: 'google_sheets_private_key_test',
    GOOGLE_SHEETS_ID: 'google_sheets_id_test',
    REPO_TOKEN: 'github_token_test',
    REPO_OWNER: 'github_owner_test',
    REPO_REPO: 'github_repo_test',
    PORT: 3000,
    CORS_ORIGIN: '*',
    JWT_SECRET: 'jwt_secret_test',
    REFRESH_TOKEN_SECRET: 'refresh_token_test',
    DATABASE_URL: 'mongodb://localhost:27017/test_db',
    MONGO_CONNECT_TIMEOUT_MS: 1000,
    MONGO_SERVER_SELECTION_TIMEOUT_MS: 1000,
    LOG_LEVEL: 'info',
    LOG_FORMAT: 'json',
    LOG_FILE_PATH: './test-logs',
    BCRYPT_ROUNDS: 1,
    ACCESS_TOKEN_EXPIRY: '15m',
    REFRESH_TOKEN_EXPIRY: '1d',
    SSE_TIMEOUT: 120000,
  };
}

export function createMockRequest(
  overrides: Partial<IAuthRequest> = {},
): IAuthRequest {
  const req: Partial<IAuthRequest> = {
    headers: {} as IncomingHttpHeaders,
    ...overrides,
  };
  return req as IAuthRequest;
}

export const createMockResponse = () => {
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
  };

  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.sendStatus = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  return res as Response;
};

export function createMockExpressRequest(
  overrides: Partial<Request> = {},
): Request {
  const req: Partial<Request> = {
    headers: {} as IncomingHttpHeaders,
    ...overrides,
  };
  return req as Request;
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
    app: {} as any,
    baseUrl: '',
    body: {},
    cookies: {},
    fresh: false,
    hostname: '',
    ip: '',
    ips: [],
    method: 'GET',
    originalUrl: '',
    params: {},
    path: '',
    protocol: 'http',
    query: {},
    route: {} as any,
    secure: false,
    signedCookies: {},
    stale: false,
    subdomains: [],
    xhr: false,
    accepts: jest.fn(),
    acceptsCharsets: jest.fn(),
    acceptsEncodings: jest.fn(),
    acceptsLanguages: jest.fn(),
    get: jest.fn(),
    header: jest.fn(),
    is: jest.fn(),
    range: jest.fn(),
    ...overrides,
  } as Request;

  return mockRequest;
}
