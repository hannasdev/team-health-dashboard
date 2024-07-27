// src/__tests__/services/GoogleSheetsService.test.ts
import { GoogleSheetsService } from "../../services/GoogleSheetsService";
import { google } from "googleapis";
import { IMetric } from "../../models/Metric";

jest.mock("googleapis");

describe("GoogleSheetsService", () => {
  let googleSheetsService: GoogleSheetsService;
  let mockSheets: jest.Mocked<typeof google.sheets>;

  beforeEach(() => {
    mockSheets = {
      spreadsheets: {
        values: {
          get: jest.fn(),
        },
      },
    } as unknown as jest.Mocked<typeof google.sheets>;

    (google.sheets as jest.Mock).mockReturnValue(mockSheets);

    googleSheetsService = new GoogleSheetsService("fake-sheet-id");
  });

  it("should fetch and parse data from Google Sheets", async () => {
    const mockSheetData = {
      data: {
        values: [
          ["Timestamp", "Metric Name", "Value"],
          ["2023-07-27T10:00:00Z", "Cycle Time", "3"],
          ["2023-07-27T11:00:00Z", "WIP", "5"],
        ],
      },
    };

    mockSheets.spreadsheets.values.get.mockResolvedValue(mockSheetData);

    const result = await googleSheetsService.fetchData();

    expect(result).toHaveLength(2);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Cycle Time",
          value: 3,
          timestamp: expect.any(Date),
        }),
        expect.objectContaining({
          name: "WIP",
          value: 5,
          timestamp: expect.any(Date),
        }),
      ])
    );

    expect(mockSheets.spreadsheets.values.get).toHaveBeenCalledWith({
      spreadsheetId: "fake-sheet-id",
      range: "A:C", // Adjust this range as needed
    });
  });

  it("should handle empty sheet data", async () => {
    const mockEmptySheetData = {
      data: {
        values: [["Timestamp", "Metric Name", "Value"]],
      },
    };

    mockSheets.spreadsheets.values.get.mockResolvedValue(mockEmptySheetData);

    const result = await googleSheetsService.fetchData();

    expect(result).toHaveLength(0);
  });

  it("should throw an error if sheet data is malformed", async () => {
    const mockMalformedSheetData = {
      data: {
        values: [
          ["Timestamp", "Metric Name", "Value"],
          ["2023-07-27T10:00:00Z", "Cycle Time"], // Missing value
        ],
      },
    };

    mockSheets.spreadsheets.values.get.mockResolvedValue(
      mockMalformedSheetData
    );

    await expect(googleSheetsService.fetchData()).rejects.toThrow(
      "Malformed sheet data"
    );
  });
});
