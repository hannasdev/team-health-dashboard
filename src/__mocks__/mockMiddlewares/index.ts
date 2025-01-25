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
  type ISecurityResponse,
  RepositoryStatus,
} from '../../interfaces';

export const createBaseMockExpressRequest = () => ({
  accepts: jest.fn(),
  acceptsCharsets: jest.fn(),
  acceptsEncodings: jest.fn(),
  acceptsLanguages: jest.fn(),
  range: jest.fn(),
  param: jest.fn(),
  is: jest.fn(),
  header: jest.fn(),
  // Add other Express.Request methods
});

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
  get?: jest.Mock;
  headers?: Record<string, string | string[] | undefined>;
}

export function createMockRequest(
  options: MockRequestOptions = {},
): jest.Mocked<IEnhancedRequest> {
  const headers = options.headers ?? {};

  const request: Partial<IEnhancedRequest> = {
    method: options.method ?? 'GET',
    path: options.path ?? '/test',
    ip: options.ip ?? '127.0.0.1',
    originalUrl: '/test',
    query: options.query ?? {},
    body: options.body ?? {},
    get:
      options.get ??
      (jest.fn(function (
        this: any,
        name: string,
      ): string | string[] | undefined {
        if (name.toLowerCase() === 'set-cookie') {
          return [] as string[];
        }
        return headers[name.toLowerCase()];
      }) as unknown as {
        (name: 'set-cookie'): string[] | undefined;
        (name: string): string | undefined;
      }),
    user: options.user ?? undefined,
    accepts: jest.fn(),
    acceptsCharsets: jest.fn(),
    acceptsEncodings: jest.fn(),
    acceptsLanguages: jest.fn(),
    header: jest.fn(),
    params: {},
    is: jest.fn(),
    range: jest.fn(),
    protocol: 'http',
    secure: false,
    ips: [],
    accepted: [],
    app: {} as any,
    baseUrl: '',
    fresh: false,
    hostname: 'localhost',
    subdomains: [],
    ...options,
  };

  return request as unknown as jest.Mocked<IEnhancedRequest>;
}

export interface MockSecurityRequestOptions extends MockRequestOptions {
  'user-agent'?: string;
  securityEvent?: ISecurityEvent;
  cookie?: string;
  'x-api-key'?: string;
  authorization?: string;
}

export const createMockSecurityRequest = (
  options: MockSecurityRequestOptions = {},
): jest.Mocked<ISecurityRequest> => {
  const request: Partial<ISecurityRequest> = {
    ...createBaseMockExpressRequest(),
    method: options.method ?? 'GET',
    path: options.path ?? '/test',
    ip: options.ip ?? '127.0.0.1',
    'user-agent': options['user-agent'] ?? 'test-user-agent',
    securityEvent: options.securityEvent,
    cookie: options.cookie,
    'x-api-key': options['x-api-key'],
    authorization: options.authorization,
    get: jest.fn(function (
      this: any,
      name: string,
    ): string | string[] | undefined {
      if (name.toLowerCase() === 'set-cookie') {
        return [] as string[];
      }
      if (name.toLowerCase() === 'user-agent') {
        return options['user-agent'] ?? 'test-user-agent';
      }
      if (name.toLowerCase() === 'authorization') {
        return options.authorization;
      }
      return '';
    }) as unknown as {
      (name: 'set-cookie'): string[] | undefined;
      (name: string): string | undefined;
    },
    user: options.user ?? { id: '123', email: 'test@example.com' },
    ...options,
    // Express.Request properties
    accepts: jest.fn(),
    acceptsCharsets: jest.fn(),
    acceptsEncodings: jest.fn(),
    acceptsLanguages: jest.fn(),
    header: jest.fn(),
    params: {},
    is: jest.fn(),
    range: jest.fn(),
    protocol: 'http',
    secure: false,
    ips: [],
    accepted: [],
    app: {} as any,
    baseUrl: '',
    fresh: false,
    hostname: 'localhost',
    subdomains: [],
  };

  return request as unknown as jest.Mocked<ISecurityRequest>;
};

type AuthenticatedRequestBody = {
  owner: string;
  name: string;
  credentials: {
    token: string;
    type: string;
    value: string;
  };
  status: RepositoryStatus;
};
interface MockAuthRequestBody extends AuthenticatedRequestBody {
  email?: string;
  password?: string;
  refreshToken?: string;
  shortLived?: boolean;
}

/**
 * Creates a mock authenticated request with user information
 */
export function createMockAuthenticatedRequest(
  options: MockRequestOptions & { body?: MockAuthRequestBody } = {},
): jest.Mocked<IAuthenticatedRequest> {
  const defaultBody: AuthenticatedRequestBody = {
    owner: '123',
    name: 'test',
    credentials: {
      token: '',
      type: 'token',
      value: 'test',
    },
    status: RepositoryStatus.ACTIVE,
  };
  const request: Partial<IAuthenticatedRequest> = {
    body: options.body ?? defaultBody,
    path: '/test',
    method: 'GET',
    ip: '127.0.0.1',
    get: jest.fn(function (
      this: any,
      name: string,
    ): string | string[] | undefined {
      if (name.toLowerCase() === 'set-cookie') {
        return [] as string[];
      }
      if (name.toLowerCase() === 'authorization') {
        return 'authorization' in options
          ? options.authorization
          : 'Bearer token';
      }
      return undefined;
    }) as unknown as {
      (name: 'set-cookie'): string[] | undefined;
      (name: string): string | undefined;
    },
    // Required Express.Request properties
    accepts: jest.fn(),
    acceptsCharsets: jest.fn(),
    acceptsEncodings: jest.fn(),
    acceptsLanguages: jest.fn(),
    header: jest.fn(),
    is: jest.fn(),
    range: jest.fn(),
    protocol: 'http',
    secure: false,
    ips: [],
    accepted: [],
    app: {} as any,
    baseUrl: '',
    fresh: false,
    hostname: 'localhost',
    subdomains: [],
    ...options,
  };

  return request as unknown as jest.Mocked<IAuthenticatedRequest>;
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
  const response: Partial<IEnhancedResponse> = {
    setHeader: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    header: jest.fn(),
    append: jest.fn(),
    attachment: jest.fn(),
    download: jest.fn(),
    format: jest.fn(),
    get: jest.fn(),
    links: jest.fn(),
    location: jest.fn(),
    redirect: jest.fn(),
    render: jest.fn(),
    sendFile: jest.fn(),
    sendStatus: jest.fn(),
    set: jest.fn(),
    type: jest.fn(),
    vary: jest.fn(),
    contentType: jest.fn(),
    clearCookie: jest.fn(),
    jsonp: jest.fn(),
    locals: {},
    charset: '',
    app: {} as any,
    headersSent: false,
    statusCode: 200,
    req: {} as any,
    statusMessage: '',
    assignSocket: jest.fn(),
    detachSocket: jest.fn(),
    writeContinue: jest.fn(),
    writeHead: jest.fn(),
  };

  return response as unknown as jest.Mocked<IEnhancedResponse>;
};

export const createMockSecurityResponse =
  (): jest.Mocked<ISecurityResponse> => {
    const response: Partial<ISecurityResponse> = {
      setHeader: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      header: jest.fn(),
      append: jest.fn(),
      attachment: jest.fn(),
      download: jest.fn(),
      format: jest.fn(),
      get: jest.fn(),
      links: jest.fn(),
      location: jest.fn(),
      redirect: jest.fn(),
      render: jest.fn(),
      sendFile: jest.fn(),
      sendStatus: jest.fn(),
      set: jest.fn(),
      type: jest.fn(),
      vary: jest.fn(),
      contentType: jest.fn(),
      clearCookie: jest.fn(),
      jsonp: jest.fn(),
      locals: {},
      charset: '',
      app: {} as any,
      headersSent: false,
      statusCode: 200,
      req: {} as any,
      statusMessage: '',
      assignSocket: jest.fn(),
      detachSocket: jest.fn(),
      writeContinue: jest.fn(),
      writeHead: jest.fn(),
    };

    return response as unknown as jest.Mocked<ISecurityResponse>;
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
