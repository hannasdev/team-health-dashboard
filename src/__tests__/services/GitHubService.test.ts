import { GitHubService } from "../../services/GitHubService";
import { Octokit } from "@octokit/rest";
import { IMetric } from "../../models/Metric";

jest.mock("@octokit/rest");

describe("GitHubService", () => {
  let githubService: GitHubService;
  let mockOctokit: jest.Mocked<Octokit>;

  beforeEach(() => {
    mockOctokit = new Octokit() as jest.Mocked<Octokit>;
    (Octokit as jest.Mock).mockImplementation(() => mockOctokit);

    githubService = new GitHubService("fake-token", "fake-owner", "fake-repo");
  });

  it("should fetch and calculate metrics from GitHub", async () => {
    const mockPullRequests = [
      {
        number: 1,
        created_at: "2023-07-25T10:00:00Z",
        merged_at: "2023-07-27T10:00:00Z",
        additions: 50,
        deletions: 20,
      },
      {
        number: 2,
        created_at: "2023-07-26T10:00:00Z",
        merged_at: "2023-07-28T10:00:00Z",
        additions: 30,
        deletions: 10,
      },
    ];

    mockOctokit.paginate.mockResolvedValue(mockPullRequests);

    const result = await githubService.fetchData();

    expect(result).toHaveLength(2); // Assuming we're calculating 2 metrics: PR Cycle Time and PR Size
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "PR Cycle Time",
          value: 48, // Average time in hours
          timestamp: expect.any(Date),
        }),
        expect.objectContaining({
          name: "PR Size",
          value: 55, // Average of (50+20) and (30+10)
          timestamp: expect.any(Date),
        }),
      ])
    );

    expect(mockOctokit.paginate).toHaveBeenCalledWith(
      mockOctokit.rest.pulls.list,
      {
        owner: "fake-owner",
        repo: "fake-repo",
        state: "closed",
        sort: "updated",
        direction: "desc",
        per_page: 100,
      }
    );
  });

  it("should handle empty pull request data", async () => {
    mockOctokit.paginate.mockResolvedValue([]);

    const result = await githubService.fetchData();

    expect(result).toHaveLength(2); // Still expect 2 metrics, but with value 0
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "PR Cycle Time", value: 0 }),
        expect.objectContaining({ name: "PR Size", value: 0 }),
      ])
    );
  });

  // Add more tests for error handling, edge cases, etc.
});
