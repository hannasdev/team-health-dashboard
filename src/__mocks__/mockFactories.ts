// @/__mocks__/mockFactories.ts
import { IncomingHttpHeaders } from 'http';

import { Request, Response } from 'express';

import {
  IAuthRequest,
  IAuthService,
  IBcryptService,
  ICacheService,
  IConfig,
  IFetchDataResult,
  IGitHubClient,
  IGitHubRepository,
  IGitHubService,
  IGoogleSheetsClient,
  IGoogleSheetsRepository,
  IGoogleSheetsService,
  IGraphQLResponse,
  IJwtService,
  ILogger,
  IMetric,
  IMetricCalculator,
  IMetricsService,
  IProgressTracker,
  IPullRequest,
} from '../interfaces/index.js';
import { UserRepository } from '../repositories/user/UserRepository.js';

export const createMockGoogleSheetsClient =
  (): jest.Mocked<IGoogleSheetsClient> => ({
    getValues: jest.fn(),
  });

export function createMockMetricCalculator(): jest.Mocked<IMetricCalculator> {
  return {
    calculateMetrics: jest.fn().mockReturnValue([]),
  };
}

export function createMockProgressTracker(): jest.Mocked<IProgressTracker> {
  return {
    trackProgress: jest.fn(),
    setReportInterval: jest.fn(),
  };
}

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
  };
}

export function createMockLogger(): jest.Mocked<ILogger> & {
  mockClear: () => void;
  getLoggedMessages: () => {
    level: string;
    message: string;
    meta?: Record<string, unknown>;
  }[];
} {
  const loggedMessages: {
    level: string;
    message: string;
    meta?: Record<string, unknown>;
  }[] = [];

  const logger: jest.Mocked<ILogger> = {
    info: jest.fn((message: string, meta?: Record<string, unknown>) => {
      loggedMessages.push({ level: 'info', message, meta });
    }),
    warn: jest.fn((message: string, meta?: Record<string, unknown>) => {
      loggedMessages.push({ level: 'warn', message, meta });
    }),
    error: jest.fn(
      (message: string, error?: Error, meta?: Record<string, unknown>) => {
        loggedMessages.push({
          level: 'error',
          message,
          meta: { ...meta, error },
        });
      },
    ),
    debug: jest.fn((message: string, meta?: Record<string, unknown>) => {
      loggedMessages.push({ level: 'debug', message, meta });
    }),
  };

  return {
    ...logger,
    mockClear: () => {
      logger.info.mockClear();
      logger.warn.mockClear();
      logger.error.mockClear();
      logger.debug.mockClear();
      loggedMessages.length = 0;
    },
    getLoggedMessages: () => [...loggedMessages],
  };
}

// Helper function to create mock pull requests
export const createMockPullRequest = (
  overrides: Partial<IPullRequest> = {},
): IPullRequest => ({
  number: 1,
  title: 'Test PR',
  state: 'open',
  author: { login: 'testuser' },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  closedAt: null,
  mergedAt: null,
  commits: { totalCount: 1 },
  additions: 10,
  deletions: 5,
  changedFiles: 2,
  baseRefName: 'main',
  baseRefOid: 'base-sha',
  headRefName: 'feature',
  headRefOid: 'head-sha',
  ...overrides,
});

// Helper function to create mock metrics
export function createMockMetric(overrides: Partial<IMetric> = {}): IMetric {
  return {
    id: 'test-metric',
    value: 10,
    unit: 'count',
    metric_category: 'test category',
    metric_name: 'test metric',
    additional_info: '',
    source: '',
    timestamp: new Date(), // Changed from empty string to new Date()
    ...overrides,
  };
}

export const createMockMetricsService = (): IMetricsService => ({
  getAllMetrics: jest.fn(() =>
    Promise.resolve({
      metrics: [],
      errors: [],
      githubStats: { totalPRs: 0, fetchedPRs: 0, timePeriod: 90 },
    }),
  ),
});

export const createCacheDecoratorMock = () => {
  const cacheable = jest.fn().mockImplementation(() => jest.fn());

  class MockCacheableClass {
    constructor(public cacheService: any) {}
  }

  return {
    Cacheable: cacheable,
    CacheableClass: MockCacheableClass,
  };
};

export function createMockGoogleSheetsService(): jest.Mocked<IGoogleSheetsService> {
  return {
    fetchData: jest.fn<
      Promise<IMetric[]>,
      [((progress: number, message: string) => void)?]
    >(),
  };
}

export function createMockGitHubService(): jest.Mocked<IGitHubService> {
  return {
    fetchData: jest.fn<
      Promise<IFetchDataResult>,
      [((current: number, total: number, message: string) => void)?, number?]
    >(),
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

export function createMockUserRepository(): jest.Mocked<UserRepository> {
  return {
    findByEmail: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
  } as unknown as jest.Mocked<UserRepository>;
}

export function createMockAuthRequest(
  overrides: Partial<IAuthRequest> = {},
): IAuthRequest {
  const req: Partial<IAuthRequest> = {
    headers: {} as IncomingHttpHeaders,
    ...overrides,
  };
  return req as IAuthRequest;
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

export const createMockAuthControllerResponse = () => {
  const json = jest.fn();
  const status = jest.fn().mockReturnThis();
  const res: Partial<Response> = {
    status,
    json,
  };
  return res as Response;
};

export const createMockAuthMiddlewareResponse = () => {
  const json = jest.fn().mockReturnThis();
  const res: Partial<Response> = {
    status: jest.fn().mockReturnValue({ json }),
    json,
  };
  return res as Response;
};

export const createMockGitHubRepository =
  (): jest.Mocked<IGitHubRepository> => ({
    fetchPullRequests: jest.fn().mockResolvedValue({
      pullRequests: [createMockPullRequest()],
      totalPRs: 1,
      fetchedPRs: 1,
      timePeriod: 90,
    }),
  });

export const createMockGoogleSheetsRepository =
  (): jest.Mocked<IGoogleSheetsRepository> => ({
    fetchMetrics: jest.fn(),
  });

export const createMockCacheService = (): jest.Mocked<ICacheService> => {
  const cache = new Map<string, { value: any; expiry: number }>();

  return {
    get: jest.fn(async (key: string) => {
      const item = cache.get(key);
      if (!item) return null;
      if (item.expiry < Date.now()) {
        cache.delete(key);
        return null;
      }
      return item.value;
    }),
    set: jest.fn(async (key: string, value: any, ttl?: number) => {
      const expiry = ttl ? Date.now() + ttl * 1000 : Infinity;
      cache.set(key, { value, expiry });
    }),
    delete: jest.fn((key: string) => {
      cache.delete(key);
    }),
    clear: jest.fn(() => {
      cache.clear();
    }),
  };
};

export function createMockGitHubClient(): jest.Mocked<IGitHubClient> {
  return {
    graphql: jest
      .fn()
      .mockImplementation(
        async <T = IGraphQLResponse>(
          query: string,
          variables?: Record<string, any>,
        ): Promise<T> => {
          // Default mock implementation
          return {} as T;
        },
      ),
  };
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

export function createMockJwtService(): jest.Mocked<IJwtService> {
  return {
    sign: jest.fn(),
    verify: jest.fn(),
    decode: jest.fn(),
  };
}

export function createMockBcryptService(): jest.Mocked<IBcryptService> {
  return {
    hash: jest.fn(),
    compare: jest.fn(),
  };
}

export const createMockAuthService = (): jest.Mocked<IAuthService> => ({
  login: jest.fn(),
  register: jest.fn(),
  refreshToken: jest.fn(),
  logout: jest.fn(),
});
