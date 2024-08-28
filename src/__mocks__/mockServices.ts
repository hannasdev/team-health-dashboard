import type {
  IAuthRequest,
  IAuthService,
  ICacheService,
  IFetchDataResult,
  IGitHubService,
  IGoogleSheetsService,
  IMetric,
  IMetricsService,
  ITokenBlacklistService,
  ITokenService,
  IGoogleSheetsClient,
  IProgressTracker,
  IMongoDbClient,
  IMetricCalculator,
} from '../interfaces/index.js';

export function createMockCacheService(): jest.Mocked<ICacheService> {
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
}

export function createMockAuthService(): jest.Mocked<IAuthService> {
  return {
    login: jest.fn().mockImplementation((email, password) => {
      if (email === 'test@example.com' && password === 'password123') {
        return Promise.resolve({
          user: { id: '1', email },
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
        });
      }
      return Promise.reject(new Error('Invalid credentials'));
    }),
    register: jest.fn().mockImplementation((email, password) => {
      if (email === 'existing@example.com') {
        return Promise.reject(new Error('User already exists'));
      }
      return Promise.resolve({
        user: { id: '2', email },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      });
    }),
    refreshToken: jest.fn().mockImplementation(refreshToken => {
      if (refreshToken === 'valid-refresh-token') {
        return Promise.resolve({
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        });
      }
      return Promise.reject(new Error('Invalid refresh token'));
    }),
    logout: jest.fn().mockImplementation(refreshToken => {
      if (refreshToken === 'valid-refresh-token') {
        return Promise.resolve();
      }
      return Promise.reject(new Error('Invalid refresh token'));
    }),
  };
}

export function createMockAuthRequest(
  overrides: Partial<IAuthRequest> = {},
): IAuthRequest {
  return {
    headers: {},
    user: undefined,
    ...overrides,
  } as IAuthRequest;
}

export function createMockTokenService(): jest.Mocked<ITokenService> {
  return {
    generateAccessToken: jest.fn(),
    generateRefreshToken: jest.fn(),
    generatePasswordResetToken: jest.fn(),
    validateAccessToken: jest.fn().mockReturnValue({
      id: 'default-id',
      email: 'default@example.com',
      exp: Math.floor(Date.now() / 1000) + 3600, // Default to 1 hour from now
    }),
    validateRefreshToken: jest.fn(),
    validatePasswordResetToken: jest.fn(),
    decodeToken: jest.fn(),
  };
}

export function createMockTokenBlacklistService(): jest.Mocked<ITokenBlacklistService> {
  return {
    blacklistToken: jest.fn(),
    isTokenBlacklisted: jest.fn(),
    revokeAllUserTokens: jest.fn(),
    _testOnly_triggerCleanup: jest.fn(),
  };
}

export function createMockMetricsService(): jest.Mocked<IMetricsService> {
  return {
    getAllMetrics: jest.fn(() =>
      Promise.resolve({
        metrics: [],
        errors: [],
        githubStats: { totalPRs: 0, fetchedPRs: 0, timePeriod: 90 },
      }),
    ),
  };
}

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

export const createMockGoogleSheetsClient =
  (): jest.Mocked<IGoogleSheetsClient> => ({
    getValues: jest.fn(),
  });

export function createMockProgressTracker(): jest.Mocked<IProgressTracker> {
  return {
    trackProgress: jest.fn(),
    setReportInterval: jest.fn(),
  };
}

export function createMockMongoDbClient(): jest.Mocked<IMongoDbClient> {
  return {
    connect: jest.fn().mockResolvedValue(undefined),
    getDb: jest.fn().mockReturnValue({}),
    close: jest.fn().mockResolvedValue(undefined),
  };
}

export function createMockMetricCalculator(): jest.Mocked<IMetricCalculator> {
  return {
    calculateMetrics: jest.fn().mockReturnValue([]),
  };
}
