// @/__mocks__/mockFactories.ts
import { IncomingHttpHeaders } from 'http';

import { Request, Response } from 'express';

import {
  IGitHubRepository,
  IGitHubService,
  IMetricCalculator,
  IGoogleSheetsService,
  IMetricsService,
  IProgressTracker,
  IConfig,
  IPullRequest,
  IMetric,
  ILogger,
  IFetchDataResult,
  IAuthRequest,
} from '@/interfaces';
import { UserRepository } from '@/repositories/user/UserRepository';

export function createMockGitHubRepository(): jest.Mocked<IGitHubRepository> {
  return {
    fetchPullRequests: jest.fn().mockResolvedValue([]),
  };
}

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
    GOOGLE_SHEETS_PRIVATE_KEY: 'google_sheets_privat_key_test',
    GOOGLE_SHEETS_ID: 'google_sheets_id_test',
    GITHUB_TOKEN: 'github_token_test',
    GITHUB_OWNER: 'github_owner_test',
    GITHUB_REPO: 'github_repo_test',
    PORT: 3000,
  };
}

export function createMockLogger(): jest.Mocked<ILogger> {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };
}

// Helper function to create mock pull requests
export function createMockPullRequest(
  overrides: Partial<IPullRequest> = {},
): IPullRequest {
  return {
    id: 1,
    number: 1,
    title: 'Test PR',
    state: 'closed',
    user: { login: 'testuser' },
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-02T00:00:00Z',
    closed_at: '2023-01-03T00:00:00Z',
    merged_at: '2023-01-03T00:00:00Z',
    commits: 1,
    additions: 10,
    deletions: 5,
    changed_files: 2,
    base: { ref: 'main', sha: 'base-sha' },
    head: { ref: 'feature', sha: 'head-sha' },
    ...overrides,
  };
}

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

export const createMockMetricsService = (): jest.Mocked<IMetricsService> => ({
  getAllMetrics: jest.fn().mockResolvedValue({ metrics: [], errors: [] }),
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
    type: jest.fn().mockReturnThis(),
    header: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    format: jest.fn(),
    get: jest.fn(),
    links: jest.fn().mockReturnThis(),
    location: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
    render: jest.fn(),
    set: jest.fn().mockReturnThis(),
    vary: jest.fn().mockReturnThis(),
    append: jest.fn().mockReturnThis(),
    attachment: jest.fn().mockReturnThis(),
    contentType: jest.fn().mockReturnThis(),
    download: jest.fn(),
    headersSent: false,
    locals: {},
    charset: '',
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
