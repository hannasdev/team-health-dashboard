import 'reflect-metadata';
import { Container } from 'inversify';

import {
  createMockJobQueueService,
  createMockProcessingService,
  createMockLogger,
} from './__mocks__';
import { TYPES } from './utils/types';
import { startWorker } from './worker';

import type {
  IJobQueueService,
  IProcessingService,
  ILogger,
} from './interfaces';

// CHANGED: Update the mock for the container
jest.mock(
  './container',
  () => ({
    container: {
      get: jest.fn(),
    },
  }),
  { virtual: true },
);

describe('Worker', () => {
  let mockJobQueueService: jest.Mocked<IJobQueueService>;
  let mockProcessingService: jest.Mocked<IProcessingService>;
  let mockLogger: jest.Mocked<ILogger>;
  let mockContainer: Container;

  beforeEach(() => {
    mockJobQueueService = createMockJobQueueService();
    mockProcessingService = createMockProcessingService();
    mockLogger = createMockLogger();

    mockContainer = {
      get: jest.fn(type => {
        switch (type) {
          case TYPES.JobQueueService:
            return mockJobQueueService;
          case TYPES.ProcessingService:
            return mockProcessingService;
          case TYPES.Logger:
            return mockLogger;
          default:
            throw new Error(`Unexpected type: ${type}`);
        }
      }),
    } as unknown as Container;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const containerModule = require('./container');
    containerModule.container.get.mockImplementation(mockContainer.get);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize the job queue', async () => {
    await startWorker();
    expect(mockJobQueueService.initialize).toHaveBeenCalled();
  });

  it('should define the processGitHubData job', async () => {
    await startWorker();
    expect(mockJobQueueService.defineJob).toHaveBeenCalledWith(
      'processGitHubData',
      expect.any(Function),
    );
  });

  it('should log successful worker start', async () => {
    await startWorker();
    expect(mockLogger.info).toHaveBeenCalledWith('Worker started successfully');
  });

  it('should handle initialization errors', async () => {
    const error = new Error('Initialization failed');
    mockJobQueueService.initialize.mockRejectedValue(error);

    await expect(startWorker()).rejects.toThrow('Initialization failed');
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to start worker:',
      error,
    );
  });

  it('should process GitHub data when job is executed', async () => {
    await startWorker();

    // Get the job handler that was passed to defineJob
    const jobHandler = mockJobQueueService.defineJob.mock.calls[0][1];

    // Create a mock job and done callback
    const mockJob = {};
    const mockDone = jest.fn();

    // Execute the job handler
    await jobHandler(mockJob, mockDone);

    expect(mockProcessingService.processGitHubDataJob).toHaveBeenCalled();
    expect(mockDone).toHaveBeenCalled();
  });

  it('should handle errors in job processing', async () => {
    const error = new Error('Processing failed');
    mockProcessingService.processGitHubDataJob.mockRejectedValue(error);

    await startWorker();

    // Get the job handler that was passed to defineJob
    const jobHandler = mockJobQueueService.defineJob.mock.calls[0][1];

    // Create a mock job and done callback
    const mockJob = {};
    const mockDone = jest.fn();

    // Execute the job handler
    await jobHandler(mockJob, mockDone);

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Error processing GitHub data job:',
      error,
    );
    expect(mockDone).toHaveBeenCalled();
  });
});
