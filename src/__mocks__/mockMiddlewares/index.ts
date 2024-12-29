import { ParsedQs } from 'qs';

export { createMockSecurityLogger } from './mockSecurityLogger';

import type {
  IEnhancedRequest,
  IEnhancedResponse,
  ISecurityHeadersConfig,
  IAuthenticatedRequest,
  IAuthRequest,
} from '../../interfaces';

export interface MockRequestOptions {
  path?: string;
  method?: string;
  ip?: string;
  query?: ParsedQs;
  body?: {
    email?: string;
    password?: string;
    refreshToken?: string;
    shortLived?: boolean;
  };
  user?: {
    id: string;
    email: string;
    exp: number;
  };
}

export function createMockRequest(
  options: MockRequestOptions = {},
): jest.Mocked<IEnhancedRequest> {
  return {
    // Base properties
    method: options.method ?? 'GET',
    path: options.path ?? '/test',
    ip: options.ip ?? '127.0.0.1',
    originalUrl: '/test',
    query: options.query ?? {},
    body: options.body ?? {},
    headers: {},
    get: jest.fn(),
    socket: {
      remoteAddress: '127.0.0.1',
    },
  } as jest.Mocked<IEnhancedRequest>;
}

/**
 * Creates a mock authenticated request with user information
 */
export function createMockAuthenticatedRequest(
  options: MockRequestOptions = {},
): jest.Mocked<IAuthenticatedRequest> {
  const defaultUser = {
    id: '123',
    email: 'test@example.com',
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  return {
    ...createMockRequest(options),
    user: options.user ?? defaultUser,
  } as jest.Mocked<IAuthenticatedRequest>;
}

export const createMockMetricsRequest = createMockAuthenticatedRequest;

/**
 * Creates a mock auth request specifically for authentication endpoints
 */
export function createMockAuthRequest(
  options: MockRequestOptions = {},
): jest.Mocked<IAuthRequest> {
  const request = createMockRequest(options);
  return {
    ...request,
    body: options.body ?? {
      email: undefined,
      password: undefined,
      refreshToken: undefined,
      shortLived: undefined,
    },
    user: options.user,
  } as jest.Mocked<IAuthRequest>;
}

export function createMockResponse(): jest.Mocked<IEnhancedResponse> {
  return {
    setHeader: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
    // Include these because they're part of the interface contract,
    // even though this middleware doesn't use them
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
  } as jest.Mocked<IEnhancedResponse>;
}

export function createDefaultSecurityConfig(): ISecurityHeadersConfig {
  return {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://cdnjs.cloudflare.com',
        ],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
    xssProtection: true,
    noSniff: true,
    frameOptions: 'DENY',
    hsts: {
      maxAge: 15552000,
      includeSubDomains: true,
      preload: true,
    },
  };
}
