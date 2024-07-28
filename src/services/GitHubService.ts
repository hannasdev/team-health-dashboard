// src/services/GitHubService.ts
import { Octokit } from "@octokit/rest";
import { Metric } from "../models/Metric";
import { IMetric } from "../interfaces/IMetricModel";
import { IGitHubService } from "../interfaces/IGitHubService";

export interface IGitHubClient {
  paginate(route: string, params: any): Promise<any[]>;
}

export class GitHubService implements IGitHubService {
  constructor(
    private client: IGitHubClient,
    private owner: string,
    private repo: string
  ) {}

  async fetchData(): Promise<IMetric[]> {
    try {
      const pullRequests = await this.client.paginate(
        "GET /repos/{owner}/{repo}/pulls",
        {
          owner: this.owner,
          repo: this.repo,
          state: "closed",
          sort: "updated",
          direction: "desc",
          per_page: 100,
        }
      );

      const prCycleTime = this.calculateAveragePRCycleTime(pullRequests);
      const prSize = this.calculateAveragePRSize(pullRequests);

      return [
        new Metric(
          "github-pr-cycle-time",
          "PR Cycle Time",
          prCycleTime,
          new Date(),
          "GitHub"
        ),
        new Metric("github-pr-size", "PR Size", prSize, new Date(), "GitHub"),
      ];
    } catch (error) {
      console.error("Error fetching data from GitHub:", error);
      throw new Error("Failed to fetch data from GitHub");
    }
  }

  private calculateAveragePRCycleTime(pullRequests: any[]): number {
    const mergedPRs = pullRequests.filter((pr) => pr.merged_at);
    if (mergedPRs.length === 0) return 0;

    const totalTime = mergedPRs.reduce((sum, pr) => {
      const createdAt = new Date(pr.created_at).getTime();
      const mergedAt = new Date(pr.merged_at).getTime();
      return sum + (mergedAt - createdAt) / (1000 * 60 * 60); // Convert to hours
    }, 0);

    return Math.round(totalTime / mergedPRs.length);
  }

  private calculateAveragePRSize(pullRequests: any[]): number {
    if (pullRequests.length === 0) return 0;

    const totalSize = pullRequests.reduce(
      (sum, pr) => sum + (pr.additions || 0) + (pr.deletions || 0),
      0
    );
    return Math.round(totalSize / pullRequests.length);
  }
}

export class OctokitAdapter implements IGitHubClient {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }

  async paginate(route: string, params: any): Promise<any[]> {
    return this.octokit.paginate(route, params);
  }
}
