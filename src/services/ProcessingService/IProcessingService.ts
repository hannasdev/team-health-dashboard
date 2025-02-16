export interface IProcessingService {
  processGitHubData(): Promise<void>;
  processGitHubDataJob(): Promise<void>;
}
