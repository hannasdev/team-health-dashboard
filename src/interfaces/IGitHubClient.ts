// src/interfaces/IGitHubClient.ts
export interface IGitHubClient {
  paginate(route: string, params: any): AsyncIterableIterator<any>;
}
