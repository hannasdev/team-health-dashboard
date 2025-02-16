export interface IRepositorySettings {
  syncEnabled: boolean;
  branchPatterns: string[];
  labelPatterns: string[];
  syncInterval?: number;
}
