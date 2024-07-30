export interface IGitHubClient {
  paginate(route: string, params: any): Promise<any[]>;
}
