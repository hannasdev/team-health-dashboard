// src/interfaces/IScheduledTaskService.ts
export interface IScheduledTaskService {
  fetchAndStoreData(): Promise<void>;
}
