import { ParsedQs } from 'qs';

export { createMockSecurityLogger } from './mockSecurityLogger';

import {
  type IEnhancedRequest,
  type IEnhancedResponse,
  type ISecurityHeadersConfig,
  type IAuthenticatedRequest,
  type IAuthRequest,
  type ISecurityEvent,
  type ISecurityRequest,
  RepositoryStatus,
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
  const response = {
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
  };
  return response as jest.Mocked<IEnhancedRequest>;
}

export interface MockSecurityRequestOptions extends MockRequestOptions {
  'user-agent'?: string;
  securityEvent?: ISecurityEvent;
}

export function createMockSecurityRequest(
  options: MockSecurityRequestOptions = {},
): jest.Mocked<ISecurityRequest> {
  const baseRequest = createMockRequest(options);

  const mockSecurityRequest: ISecurityRequest = {
    ...baseRequest,
    'user-agent': options['user-agent'] ?? 'test-user-agent',
    securityEvent: options.securityEvent,
    get: jest.fn((name: string) => {
      if (name.toLowerCase() === 'user-agent') {
        return options['user-agent'] ?? 'test-user-agent';
      }
      return baseRequest.get(name);
    }),
  };

  return mockSecurityRequest as jest.Mocked<ISecurityRequest>;
}
/**
 * Creates a mock authenticated request with user information
 */
export function createMockAuthenticatedRequest(
  options: MockRequestOptions = {},
): jest.Mocked<IAuthenticatedRequest> {
  const mockRequest: jest.Mocked<IAuthenticatedRequest> = {
    user: {
      id: '123',
      email: 'test@example.com',
      exp: 1234567,
    },
    query: {},
    authorization: 'Bearer token',
    params: {
      id: '123',
    },
    body: {
      owner: '123',
      name: 'test',
      credentials: {
        token: '',
        type: 'token',
        value: 'test',
      },
      status: RepositoryStatus.ACTIVE,
    },
    path: '/test',
    method: 'GET',
    ip: '127.0.0.1',
    get: jest.fn((name: string) => {
      // Case-insensitive header lookup
      const normalizedName = name.toLowerCase();
      switch (normalizedName) {
        case 'authorization':
          // Return undefined if authorization was explicitly set to undefined
          return 'authorization' in options ? options.authorization : undefined;
        default:
          return undefined;
      }
    }),
    // Add other required properties
  };
  return mockRequest;
}

export const createMockMetricsRequest = createMockAuthenticatedRequest;

/**
 * Creates a mock auth request specifically for authentication endpoints
 */
export function createMockAuthRequest(
  options: MockRequestOptions = {},
): jest.Mocked<IAuthRequest> {
  const request = createMockRequest(options);
  const response = {
    ...request,
    body: options.body ?? {
      email: undefined,
      password: undefined,
      refreshToken: undefined,
      shortLived: undefined,
    },
  };
  return response as jest.Mocked<IAuthRequest>;
}

export const createMockResponse = (): jest.Mocked<IEnhancedResponse> => {
  const response = {
    setHeader: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
  };
  return response as jest.Mocked<IEnhancedResponse>;
};

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

export const createMockMiddleware = (): { handle: jest.Mock } => ({
  handle: jest.fn().mockImplementation((req, res, next) => next()),
});
