// src/__mocks__/serviceMocks.ts
import type { IGitHubService } from '../interfaces/IGitHubService';
import type { IMetricsService } from '../interfaces/IMetricsService';
import type { IGoogleSheetsService } from '../interfaces/IGoogleSheetsService';

export const createMockGoogleSheetsService =
  (): jest.Mocked<IGoogleSheetsService> => ({
    fetchData: jest.fn().mockResolvedValue([]),
  });

export const createMockGitHubService = (): jest.Mocked<IGitHubService> => ({
  fetchData: jest.fn().mockResolvedValue([]),
});

export const createMockMetricsService = (): jest.Mocked<IMetricsService> => ({
  getAllMetrics: jest.fn().mockResolvedValue({ metrics: [], errors: [] }),
});
