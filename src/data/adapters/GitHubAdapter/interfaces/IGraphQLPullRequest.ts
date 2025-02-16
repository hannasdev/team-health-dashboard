export interface IGraphQLPullRequest {
  id: string;
  number: number;
  title: string;
  state: string;
  author: { login: string } | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  mergedAt: string | null;
  commits: { totalCount: number };
  additions: number;
  deletions: number;
  changedFiles: number;
  baseRefName: string;
  baseRefOid: string;
  headRefName: string;
  headRefOid: string;
}
