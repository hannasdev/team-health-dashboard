import { User } from '../data/models/User.js';
import {
  UserAlreadyExistsError,
  UserNotFoundError,
  AppError,
} from '../utils/errors.js';

import type {
  IAuthRequest,
  IAuthenticationService,
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
  IUserService,
} from '../interfaces/index.js';
import type { ProgressCallback } from '../types/index.js';

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

export function createMockAuthenticationService(): jest.Mocked<IAuthenticationService> {
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

export function createMockUserService(): jest.Mocked<IUserService> {
  return {
    registerUser: jest.fn().mockImplementation((email, password) => {
      if (email === 'existing@example.com') {
        return Promise.reject(new UserAlreadyExistsError());
      }
      return Promise.resolve(new User('2', email, 'hashedPassword'));
    }),
    getUserById: jest.fn().mockImplementation(id => {
      if (id === '1') {
        return Promise.resolve(
          new User('1', 'test@example.com', 'hashedPassword'),
        );
      }
      return Promise.reject(
        new UserNotFoundError(`User not found for id: ${id}`),
      );
    }),
    updateUserProfile: jest.fn().mockImplementation((id, data) => {
      return Promise.resolve(
        new User(id, data.email || 'updated@example.com', 'hashedPassword'),
      );
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
  let isCancelled = false;

  return {
    getAllMetrics: jest
      .fn()
      .mockImplementation(
        async (
          progressCallback?: ProgressCallback,
          timePeriod: number = 90,
        ) => {
          if (progressCallback) {
            // Simulate progress updates
            progressCallback(25, 100, 'Google Sheets: 50% complete');

            if (isCancelled) {
              throw new AppError(499, 'Operation cancelled');
            }

            progressCallback(75, 100, 'GitHub: 50% complete');

            if (isCancelled) {
              throw new AppError(499, 'Operation cancelled');
            }

            progressCallback(100, 100, 'Completed fetching all metrics');
          }

          if (isCancelled) {
            throw new AppError(499, 'Operation cancelled');
          }

          return {
            metrics: [
              {
                id: 'mock-metric-1',
                metric_category: 'Mock',
                metric_name: 'Mock Metric 1',
                value: 42,
                timestamp: new Date().toISOString(),
                unit: 'count',
                additional_info: '',
                source: 'Mock',
              },
            ],
            errors: [],
            githubStats: { totalPRs: 10, fetchedPRs: 10, timePeriod },
          };
        },
      ),
    cancelOperation: jest.fn().mockImplementation(() => {
      isCancelled = true;
    }),
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
    calculateMetrics: jest
      .fn()
      .mockReturnValue([
        createMockMetric({ id: 'github-pr-count', source: 'GitHub' }),
        createMockMetric({ id: 'github-pr-cycle-time', source: 'GitHub' }),
        createMockMetric({ id: 'github-pr-size', source: 'GitHub' }),
      ]),
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
