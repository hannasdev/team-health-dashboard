import { MetricsService } from "../../services/MetricsService";
import { GoogleSheetsService } from "../../services/GoogleSheetsService";
import { GitHubService } from "../../services/GitHubService";
import { IMetric } from "../../models/Metric";

jest.mock("../../services/GoogleSheetsService");
jest.mock("../../services/GitHubService");

describe("MetricsService", () => {
  let metricsService: MetricsService;
  let mockGoogleSheetsService: jest.Mocked<GoogleSheetsService>;
  let mockGitHubService: jest.Mocked<GitHubService>;

  beforeEach(() => {
    mockGoogleSheetsService =
      new GoogleSheetsService() as jest.Mocked<GoogleSheetsService>;
    mockGitHubService = new GitHubService() as jest.Mocked<GitHubService>;
    metricsService = new MetricsService(
      mockGoogleSheetsService,
      mockGitHubService
    );
  });

  it("should fetch and combine metrics from Google Sheets and GitHub", async () => {
    const mockSheetData: IMetric[] = [
      { id: "1", name: "Cycle Time", value: 3, timestamp: new Date() },
    ];
    const mockGitHubData: IMetric[] = [
      { id: "2", name: "PR Size", value: 50, timestamp: new Date() },
    ];

    mockGoogleSheetsService.fetchData.mockResolvedValue(mockSheetData);
    mockGitHubService.fetchData.mockResolvedValue(mockGitHubData);

    const result = await metricsService.getMetrics();

    expect(result).toHaveLength(2);
    expect(result).toEqual(
      expect.arrayContaining([...mockSheetData, ...mockGitHubData])
    );
    expect(mockGoogleSheetsService.fetchData).toHaveBeenCalledTimes(1);
    expect(mockGitHubService.fetchData).toHaveBeenCalledTimes(1);
  });
});
