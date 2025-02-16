export interface IGitHubRepositoryMetadataResponse {
  repository: {
    isPrivate: boolean;
    description: string | null;
    defaultBranchRef: {
      name: string;
    };
    repositoryTopics: {
      nodes: Array<{
        topic: {
          name: string;
        };
      }>;
    };
    primaryLanguage: {
      name: string;
    } | null;
  } | null;
}
