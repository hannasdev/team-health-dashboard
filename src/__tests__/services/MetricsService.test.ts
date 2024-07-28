// src/__tests__/services/MetricsService.test.ts
import { MetricsService } from "../../services/MetricsService";
import { IGoogleSheetsClient } from "../../services/GoogleSheetsService";
import { IGitHubClient } from "../../services/GitHubService";
import { IMetric } from "../../interfaces/IMetricModel";
import { IMetricsService } from "../../interfaces/IMetricsService";
import { jest } from "@jest/globals";

describe("MetricsService", () => {
  let metricsService: IMetricsService;
  let mockGoogleSheetsClient: jest.Mocked<IGoogleSheetsClient>;
  let mockGitHubClient: jest.Mocked<IGitHubClient>;

  beforeEach(() => {
    mockGoogleSheetsClient = {
      getValues: jest.fn(),
    };
    mockGitHubClient = {
      paginate: jest.fn(),
    };
    metricsService = new MetricsService(
      mockGoogleSheetsClient,
      mockGitHubClient,
      "fake-spreadsheet-id",
      "fake-owner",
      "fake-repo"
    );
  });

  it("should fetch and combine metrics from Google Sheets and GitHub", async () => {
    const mockSheetData = [
      ["Timestamp", "Metric Name", "Value"],
      ["2023-07-27T10:00:00Z", "Cycle Time", "3"],
    ];
    const mockPullRequests = [
      {
        number: 1,
        created_at: "2023-07-25T10:00:00Z",
        merged_at: "2023-07-27T10:00:00Z",
        additions: 50,
        deletions: 20,
      },
    ];

    mockGoogleSheetsClient.getValues.mockResolvedValue({
      data: { values: mockSheetData },
    });
    mockGitHubClient.paginate.mockResolvedValue(mockPullRequests);

    const result = await metricsService.getAllMetrics();

    expect(result.metrics).toHaveLength(3); // 1 from Sheets, 2 from GitHub (PR Cycle Time and PR Size)
    expect(result.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Cycle Time",
          value: 3,
          source: "Google Sheets",
        }),
        expect.objectContaining({
          name: "PR Cycle Time",
          source: "GitHub",
        }),
        expect.objectContaining({
          name: "PR Size",
          source: "GitHub",
        }),
      ])
    );
    expect(result.errors).toHaveLength(0);
  });

  it("should handle errors from Google Sheets client", async () => {
    const mockPullRequests = [
      {
        number: 1,
        created_at: "2023-07-25T10:00:00Z",
        merged_at: "2023-07-27T10:00:00Z",
        additions: 50,
        deletions: 20,
      },
    ];

    mockGoogleSheetsClient.getValues.mockRejectedValue(
      new Error("Google Sheets API error")
    );
    mockGitHubClient.paginate.mockResolvedValue(mockPullRequests);

    const result = await metricsService.getAllMetrics();

    expect(result.metrics).toHaveLength(2); // 2 from GitHub (PR Cycle Time and PR Size)
    expect(result.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "PR Cycle Time",
          source: "GitHub",
        }),
        expect.objectContaining({
          name: "PR Size",
          source: "GitHub",
        }),
      ])
    );
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toEqual({
      source: "Google Sheets",
      message: "Failed to fetch Google Sheets data",
    });
  });

  it("should handle errors from GitHub client", async () => {
    const mockSheetData = [
      ["Timestamp", "Metric Name", "Value"],
      ["2023-07-27T10:00:00Z", "Cycle Time", "3"],
    ];

    mockGoogleSheetsClient.getValues.mockResolvedValue({
      data: { values: mockSheetData },
    });
    mockGitHubClient.paginate.mockRejectedValue(new Error("GitHub API error"));

    const result = await metricsService.getAllMetrics();

    expect(result.metrics).toHaveLength(1);
    expect(result.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Cycle Time",
          value: 3,
          source: "Google Sheets",
        }),
      ])
    );
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toEqual({
      source: "GitHub",
      message: "Failed to fetch GitHub data",
    });
  });

  it("should handle errors from both clients", async () => {
    mockGoogleSheetsClient.getValues.mockRejectedValue(
      new Error("Google Sheets API error")
    );
    mockGitHubClient.paginate.mockRejectedValue(new Error("GitHub API error"));

    const result = await metricsService.getAllMetrics();

    expect(result.metrics).toHaveLength(0);
    expect(result.errors).toHaveLength(2);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        {
          source: "Google Sheets",
          message: "Failed to fetch Google Sheets data",
        },
        {
          source: "GitHub",
          message: "Failed to fetch GitHub data",
        },
      ])
    );
  });
});
