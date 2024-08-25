// src/utils/ApiResponse.ts

import type { IApiResponse } from '../../interfaces';

export function createSuccessResponse<T>(data: T): IApiResponse<T> {
  return { success: true, data };
}

export function createErrorResponse(error: string): IApiResponse<never> {
  return { success: false, error };
}
