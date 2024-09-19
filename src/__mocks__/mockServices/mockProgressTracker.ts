import type { IProgressTracker } from '../../interfaces/index.js';

export function createMockProgressTracker(): jest.Mocked<IProgressTracker> {
  return {
    trackProgress: jest.fn(),
    setReportInterval: jest.fn(),
  };
}
