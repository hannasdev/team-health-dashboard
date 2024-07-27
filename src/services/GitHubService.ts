// src/services/GitHubService.ts
import { Octokit } from "@octokit/rest";
import { IMetric, Metric } from "../models/Metric";

export class GitHubService {
  private octokit: Octokit;

  constructor(
    private token: string,
    private owner: string,
    private repo: string
  ) {
    this.octokit = new Octokit({ auth: token });
  }

  async fetchData(): Promise<IMetric[]> {
    try {
      const pullRequests = await this.octokit.paginate(
        this.octokit.rest.pulls.list,
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
          new Date()
        ),
        new Metric("github-pr-size", "PR Size", prSize, new Date()),
      ];
    } catch (error) {
      console.error("Error fetching data from GitHub:", error);
      throw error;
    }
  }

  private calculateAveragePRCycleTime(pullRequests: any[]): number {
    if (pullRequests.length === 0) return 0;

    const totalTime = pullRequests.reduce((sum, pr) => {
      const createdAt = new Date(pr.created_at).getTime();
      const mergedAt = new Date(pr.merged_at).getTime();
      return sum + (mergedAt - createdAt) / (1000 * 60 * 60); // Convert to hours
    }, 0);

    return Math.round(totalTime / pullRequests.length);
  }

  private calculateAveragePRSize(pullRequests: any[]): number {
    if (pullRequests.length === 0) return 0;

    const totalSize = pullRequests.reduce(
      (sum, pr) => sum + pr.additions + pr.deletions,
      0
    );
    return Math.round(totalSize / pullRequests.length);
  }
}
