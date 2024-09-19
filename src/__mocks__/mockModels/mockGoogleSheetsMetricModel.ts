import type { GoogleSheetsMetricModel } from '../../types/index.js';

export const createMockGoogleSheetsMetricModel =
  (): jest.Mocked<GoogleSheetsMetricModel> =>
    ({
      find: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
      insertMany: jest.fn().mockResolvedValue(undefined),
      countDocuments: jest.fn().mockResolvedValue(0),
      findOneAndUpdate: jest.fn().mockResolvedValue(null),
    }) as unknown as jest.Mocked<GoogleSheetsMetricModel>;
