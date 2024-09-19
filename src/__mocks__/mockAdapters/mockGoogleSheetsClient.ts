import type { IGoogleSheetsClient } from '../../interfaces/index.js';

/**
 * Mock Google Sheets client
 * @returns {IGoogleSheetsClient}
 */
export const createMockGoogleSheetsClient =
  (): jest.Mocked<IGoogleSheetsClient> => ({
    getValues: jest.fn(),
  });
