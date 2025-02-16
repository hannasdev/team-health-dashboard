export interface IRepositoryMetadata {
  isPrivate: boolean;
  defaultBranch: string;
  description?: string;
  topics?: string[];
  language?: string;
}
