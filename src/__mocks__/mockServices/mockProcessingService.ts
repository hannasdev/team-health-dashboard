import type { IProcessingService } from '../../interfaces/IProcessingService';

export function createMockProcessingService(): jest.Mocked<IProcessingService> {
  return {
    processGitHubData: jest.fn().mockResolvedValue(undefined),
    processGitHubDataJob: jest.fn().mockResolvedValue(undefined),
  };
}
