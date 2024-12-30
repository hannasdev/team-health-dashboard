import { ParsedQs } from 'qs';

export { createMockSecurityLogger } from './mockSecurityLogger';

import type {
  IEnhancedRequest,
  IEnhancedResponse,
  ISecurityHeadersConfig,
  IAuthenticatedRequest,
  IAuthRequest,
  ISecurityEvent,
  ISecurityRequest,
} from '../../interfaces';

export interface MockRequestOptions {
  path?: string;
  method?: string;
  ip?: string;
  query?: ParsedQs;
  origin?: string;
  authorization?: string;
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
    method: options.method ?? 'GET',
    path: options.path ?? '/test',
    ip: options.ip ?? '127.0.0.1',
    originalUrl: '/test',
    query: options.query ?? {},
    body: options.body ?? {},
    origin: options.origin,
    authorization: options.authorization,
    get: jest.fn((name: string) => {
      // Case-insensitive header lookup
      const normalizedName = name.toLowerCase();
      switch (normalizedName) {
        case 'origin':
          // Return undefined if origin was explicitly set to undefined
          return 'origin' in options ? options.origin : undefined;
        case 'authorization':
          // Return undefined if authorization was explicitly set to undefined
          return 'authorization' in options ? options.authorization : undefined;
        default:
          return undefined;
      }
    }),
    user: options.user ?? undefined,
  } as jest.Mocked<IEnhancedRequest>;
}

export interface MockSecurityRequestOptions extends MockRequestOptions {
  'user-agent'?: string;
  securityEvent?: ISecurityEvent;
}

export function createMockSecurityRequest(
  options: MockSecurityRequestOptions = {},
): jest.Mocked<ISecurityRequest> {
  const baseRequest = createMockRequest(options);

  return {
    ...baseRequest,
    'user-agent': options['user-agent'] ?? 'test-user-agent',
    securityEvent: options.securityEvent,
    get: jest.fn((name: string) => {
      if (name.toLowerCase() === 'user-agent') {
        return options['user-agent'] ?? 'test-user-agent';
      }
      return baseRequest.get(name);
    }),
  } as jest.Mocked<ISecurityRequest>;
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
  } as jest.Mocked<IAuthRequest>;
}

export function createMockResponse(): jest.Mocked<IEnhancedResponse> {
  return {
    setHeader: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
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
