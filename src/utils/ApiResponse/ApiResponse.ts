// src/utils/ApiResponse.ts

import { IApiResponse } from '../../interfaces/index.js';

export function createSuccessResponse<T>(data: T): IApiResponse<T> {
  return { success: true, data };
}

export function createErrorResponse(error: string): IApiResponse<never> {
  return { success: false, error };
}
