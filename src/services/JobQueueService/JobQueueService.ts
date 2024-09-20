import Agenda from 'agenda';
import { inject, injectable } from 'inversify';

import { TYPES } from '../../utils/types.js';

import type {
  IConfig,
  ILogger,
  IJobQueueService,
} from '../../interfaces/index.js';

@injectable()
export class JobQueueService implements IJobQueueService {
  private agenda: Agenda;

  constructor(
    @inject(TYPES.Config) private config: IConfig,
    @inject(TYPES.Logger) private logger: ILogger,
  ) {
    this.agenda = new Agenda({
      db: { address: this.config.DATABASE_URL, collection: 'jobQueue' },
    });

    this.agenda.on('ready', () => this.logger.info('Agenda is ready'));
    this.agenda.on('error', error => this.logger.error('Agenda error:', error));
  }

  public async initialize(): Promise<void> {
    try {
      await this.agenda.start();
      this.logger.info('Job queue initialized');
    } catch (error) {
      this.logger.error('Failed to initialize job queue:', error as Error);
      throw error;
    }
  }

  public async scheduleJob(
    jobName: string,
    data: any,
    options?: any,
  ): Promise<void> {
    try {
      await this.agenda.schedule('now', jobName, data);
      this.logger.info(`Job scheduled: ${jobName}`);
    } catch (error) {
      this.logger.error(`Failed to schedule job ${jobName}:`, error as Error);
      throw error;
    }
  }

  public async defineJob(
    jobName: string,
    handler: (job: any, done: () => void) => void,
  ): Promise<void> {
    try {
      this.agenda.define(jobName, handler);
      this.logger.info(`Job defined: ${jobName}`);
    } catch (error) {
      this.logger.error(`Failed to define job ${jobName}:`, error as Error);
      throw error;
    }
  }

  async gracefulShutdown(): Promise<void> {
    try {
      await this.agenda.stop();
      this.logger.info('Job queue gracefully shut down');
    } catch (error) {
      this.logger.error('Failed to shut down job queue:', error as Error);
      throw error;
    }
  }
}
