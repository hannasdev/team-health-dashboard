import type { IApiResponse } from '../../interfaces';

export function createMockApiResponse(): jest.Mocked<IApiResponse> {
  return {
    createSuccessResponse: jest.fn(),
    createErrorResponse: jest.fn(),
  };
}
