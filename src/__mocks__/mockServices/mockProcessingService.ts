import type { IProcessingService } from '../../interfaces/index.js';

export function createMockProcessingService(): jest.Mocked<IProcessingService> {
  return {
    processGitHubData: jest.fn().mockResolvedValue(undefined),
  };
}
