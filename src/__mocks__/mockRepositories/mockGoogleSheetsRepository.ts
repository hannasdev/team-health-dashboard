import { createMockMetric } from '../mockServices';

import type { IGoogleSheetsRepository } from '../../interfaces/index';

export const createMockGoogleSheetsRepository =
  (): jest.Mocked<IGoogleSheetsRepository> => ({
    fetchRawData: jest.fn().mockResolvedValue([
      ['header1', 'header2'],
      ['data1', 'data2'],
    ]),
    storeMetrics: jest.fn().mockResolvedValue(undefined),
    getMetrics: jest
      .fn()
      .mockResolvedValue([createMockMetric(), createMockMetric()]),
    getTotalMetricsCount: jest.fn().mockResolvedValue(2),
    updateMetrics: jest.fn().mockResolvedValue(undefined),
  });
