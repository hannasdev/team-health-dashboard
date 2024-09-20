import type { IJobQueueService } from '../../interfaces/IJobQueueService';

export function createMockJobQueueService(): jest.Mocked<IJobQueueService> {
  return {
    initialize: jest.fn().mockResolvedValue(undefined),
    scheduleJob: jest.fn().mockResolvedValue(undefined),
    defineJob: jest.fn().mockImplementation((jobName, handler) => {
      // Store the handler so it can be called in tests if needed
      (createMockJobQueueService as any).jobHandlers = {
        ...(createMockJobQueueService as any).jobHandlers,
        [jobName]: handler,
      };
      return Promise.resolve();
    }),
    gracefulShutdown: jest.fn().mockResolvedValue(undefined),
  };
}

// Add a method to get the stored job handler (for use in tests)
(createMockJobQueueService as any).getJobHandler = (jobName: string) => {
  return (createMockJobQueueService as any).jobHandlers?.[jobName];
};
