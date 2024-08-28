// src/utils/ApiResponse.ts

import type { IApiResponse } from '../../interfaces';

export function createSuccessResponse<T>(data: T): IApiResponse<T> {
  return { success: true, data };
}

export const createErrorResponse = (
  message: string,
  statusCode: number = 500,
) => ({
  success: false,
  error: message,
  statusCode,
});
