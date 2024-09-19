import { injectable } from 'inversify';

import type { IGoogleSheetsClient } from '../../interfaces/index.js';

@injectable()
export class MockGoogleSheetsAdapter implements IGoogleSheetsClient {
  getValues = jest.fn().mockResolvedValue({
    data: {
      values: [
        [
          'Timestamp',
          'Metric Category',
          'Metric Name',
          'Value',
          'Unit',
          'Additional Info',
        ],
        ['2023-01-01', 'Test Category', 'Test Metric', '10', 'count', ''],
      ],
    },
  });
}
