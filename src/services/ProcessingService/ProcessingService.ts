import { injectable, inject } from 'inversify';

import { AppError } from '../../utils/errors.js';
import { TYPES } from '../../utils/types.js';

import type {
  IProcessingService,
  IGitHubRepository,
  IMetricCalculator,
  ILogger,
  IPullRequest,
  IJobQueueService,
} from '../../interfaces/index.js';

/**
 * Processes GitHub data by fetching pull requests, calculating metrics, and storing the processed metrics.
 * This class is responsible for the main logic of processing GitHub data and is injected with dependencies
 * such as the GitHub repository, metric calculator, and logger.
 */
@injectable()
export class ProcessingService implements IProcessingService {
  constructor(
    @inject(TYPES.GitHubRepository) private repository: IGitHubRepository,
    @inject(TYPES.MetricCalculator) private metricCalculator: IMetricCalculator,
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.JobQueueService) private jobQueue: IJobQueueService,
  ) {}

  public async processGitHubData(): Promise<void> {
    try {
      await this.jobQueue.scheduleJob('processGitHubData', {});
      this.logger.info('Scheduled GitHub data processing job');
    } catch (error) {
      this.logger.error(
        'Error scheduling GitHub data processing job:',
        error as Error,
      );
      throw new AppError(500, 'Failed to schedule GitHub data processing');
    }
  }

  public async processGitHubDataJob(): Promise<void> {
    try {
      const batchSize = 100;
      let page = 1;
      let hasMore = true;
      let totalProcessed = 0;

      while (hasMore) {
        const rawPullRequests = await this.repository.getRawPullRequests(
          page,
          batchSize,
        );

        if (rawPullRequests.length === 0) {
          hasMore = false;
          continue;
        }

        const metrics = this.metricCalculator.calculateMetrics(rawPullRequests);

        await this.repository.storeProcessedMetrics(metrics);
        await this.markPullRequestsAsProcessed(rawPullRequests);

        totalProcessed += rawPullRequests.length;
        this.logger.info(
          `Processed ${rawPullRequests.length} pull requests on page ${page}. Total processed: ${totalProcessed}`,
        );
        page++;
      }

      this.logger.info(
        `Finished processing all GitHub data. Total processed: ${totalProcessed}`,
      );
    } catch (error) {
      this.logger.error('Error in GitHub data processing job:', error as Error);
      throw new AppError(500, 'Failed to process GitHub data');
    }
  }

  private async markPullRequestsAsProcessed(
    pullRequests: IPullRequest[],
  ): Promise<void> {
    const ids = pullRequests.map(pr => pr.id);
    await this.repository.markPullRequestsAsProcessed(ids);
  }
}
