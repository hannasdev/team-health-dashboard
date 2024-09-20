export interface IJobQueueService {
  initialize(): Promise<void>;
  scheduleJob(jobName: string, data: any, options?: any): Promise<void>;
  defineJob(
    jobName: string,
    handler: (job: any, done: () => void) => void,
  ): Promise<void>;
  gracefulShutdown(): Promise<void>;
}
