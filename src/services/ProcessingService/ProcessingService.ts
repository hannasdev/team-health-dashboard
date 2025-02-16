import { injectable, inject } from 'inversify';

import { RepositoryStatus } from '../../types/index.js';
import { AppError } from '../../utils/errors.js';
import { TYPES } from '../../utils/types.js';

import type { IProcessingService } from './IProcessingService.js';
import type { ILogger } from '../../cross-cutting/Logger/ILogger.js';
import type {
  IPullRequest,
  IGitHubRepository,
} from '../../data/repositories/GitHubRepository/interfaces/index.js';
import type {
  IRepository,
  IRepositoryRepository,
} from '../../data/repositories/RepositoryRepository/interfaces/index.js';
import type { IJobQueueService } from '../JobQueueService/IJobQueueService.js';
import type { IMetricsCalculator } from '../MetricsCalculator/index.js';

/**
 * Processes GitHub data by fetching pull requests, calculating metrics, and storing the processed metrics.
 * This class is responsible for the main logic of processing GitHub data and is injected with dependencies
 * such as the GitHub repository, metric calculator, and logger.
 */
@injectable()
export class ProcessingService implements IProcessingService {
  constructor(
    @inject(TYPES.GitHubRepository) private repository: IGitHubRepository,
    @inject(TYPES.RepositoryRepository)
    private repoMetadataRepo: IRepositoryRepository,
    @inject(TYPES.MetricCalculator)
    private metricCalculator: IMetricsCalculator,
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.JobQueueService) private jobQueue: IJobQueueService,
  ) {}

  private async getActiveRepository(): Promise<IRepository> {
    const repositories = await this.repoMetadataRepo.findAll({
      status: RepositoryStatus.ACTIVE,
      syncEnabled: true,
      page: 0,
      pageSize: 1,
    });

    if (!repositories.items.length) {
      throw new AppError(404, 'No active repositories configured');
    }

    return repositories.items[0];
  }

  private getRepositoryCredentials(repository: IRepository): {
    owner: string;
    name: string;
    token: string;
  } {
    if (!repository.credentials?.value) {
      throw new AppError(400, 'Repository credentials not configured');
    }

    return {
      owner: repository.owner,
      name: repository.name,
      token: repository.credentials.value,
    };
  }

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
      const repository = await this.getActiveRepository();
      const credentials = this.getRepositoryCredentials(repository);

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
