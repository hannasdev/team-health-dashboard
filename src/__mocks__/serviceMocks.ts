// src/__mocks__/serviceMocks.ts
import { IGitHubService } from "../interfaces/IGitHubService";
import { IMetricsService } from "../interfaces/IMetricsService";

// export const createMockGoogleSheetsService =
//   (): jest.Mocked<IGoogleSheetsService> => ({
//     fetchData: jest.fn(),
//   });

export const createMockGitHubService = (): jest.Mocked<IGitHubService> => ({
  fetchData: jest.fn(),
});

export const createMockMetricsService = (): jest.Mocked<IMetricsService> => ({
  getAllMetrics: jest.fn(),
});
