// src/__tests__/services/GoogleSheetsService.test.ts
import {
  GoogleSheetsService,
  IGoogleSheetsClient,
} from "../../services/GoogleSheetsService";
import { IGoogleSheetsService } from "../../interfaces/IGoogleSheetsService";
import { jest } from "@jest/globals";

describe("GoogleSheetsService", () => {
  let googleSheetsService: IGoogleSheetsService;
  let mockGoogleSheetsClient: jest.Mocked<IGoogleSheetsClient>;

  beforeEach(() => {
    mockGoogleSheetsClient = {
      getValues: jest.fn(),
    };
    googleSheetsService = new GoogleSheetsService(
      mockGoogleSheetsClient,
      "fake-sheet-id"
    );
  });

  it("should fetch and parse data from Google Sheets", async () => {
    const mockSheetData = [
      ["Timestamp", "Metric Name", "Value"],
      ["2023-07-27T10:00:00Z", "Cycle Time", "3"],
      ["2023-07-27T11:00:00Z", "WIP", "5"],
    ];

    mockGoogleSheetsClient.getValues.mockResolvedValue({
      data: { values: mockSheetData },
    });

    const result = await googleSheetsService.fetchData();

    expect(result).toHaveLength(2);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Cycle Time",
          value: 3,
          source: "Google Sheets",
        }),
        expect.objectContaining({
          name: "WIP",
          value: 5,
          source: "Google Sheets",
        }),
      ])
    );
  });
  it("should handle empty sheet data", async () => {
    const mockEmptySheetData = [["Timestamp", "Metric Name", "Value"]];

    mockGoogleSheetsClient.getValues.mockResolvedValue({
      data: { values: mockEmptySheetData },
    });

    const result = await googleSheetsService.fetchData();

    expect(result).toHaveLength(0);
  });

  it("should skip malformed rows", async () => {
    const mockMalformedSheetData = [
      ["Timestamp", "Metric Name", "Value"],
      ["2023-07-27T10:00:00Z", "Cycle Time", "3"],
      ["2023-07-27T11:00:00Z", "WIP"],
      ["2023-07-27T12:00:00Z", "Lead Time", "7"],
    ];

    mockGoogleSheetsClient.getValues.mockResolvedValue({
      data: { values: mockMalformedSheetData },
    });

    const result = await googleSheetsService.fetchData();

    expect(result).toHaveLength(2);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Cycle Time",
          value: 3,
          source: "Google Sheets",
        }),
        expect.objectContaining({
          name: "Lead Time",
          value: 7,
          source: "Google Sheets",
        }),
      ])
    );
  });

  it("should throw an error when failing to fetch data", async () => {
    mockGoogleSheetsClient.getValues.mockRejectedValue(new Error("API error"));

    await expect(googleSheetsService.fetchData()).rejects.toThrow(
      "Failed to fetch data from Google Sheets"
    );
  });
});
