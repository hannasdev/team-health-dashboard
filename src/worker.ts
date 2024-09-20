import 'reflect-metadata';
import { container } from './container';
import { TYPES } from './utils/types';

import type {
  IJobQueueService,
  IProcessingService,
  ILogger,
} from './interfaces';

export async function startWorker() {
  const jobQueue = container.get<IJobQueueService>(TYPES.JobQueueService);
  const processingService = container.get<IProcessingService>(
    TYPES.ProcessingService,
  );
  const logger = container.get<ILogger>(TYPES.Logger);

  try {
    await jobQueue.initialize();

    jobQueue.defineJob('processGitHubData', async (job, done) => {
      try {
        await processingService.processGitHubDataJob();
        done();
      } catch (error) {
        logger.error('Error processing GitHub data job:', error as Error);
        done();
      }
    });

    logger.info('Worker started successfully');
  } catch (error) {
    logger.error('Failed to start worker:', error as Error);
    throw error;
  }
}

if (require.main === module) {
  startWorker();
}

process.on('SIGTERM', async () => {
  const jobQueue = container.get<IJobQueueService>(TYPES.JobQueueService);
  await jobQueue.gracefulShutdown();
  process.exit(0);
});
