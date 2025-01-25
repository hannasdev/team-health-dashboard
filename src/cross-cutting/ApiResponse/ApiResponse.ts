// src/utils/ApiResponse/ApiResponse.ts

import { injectable } from 'inversify';

import type { IApiResponse } from '../../interfaces';

@injectable()
export class ApiResponse implements IApiResponse {
  public createSuccessResponse<T>(data: T): { success: true; data: T } {
    return { success: true, data };
  }

  public createErrorResponse(
    message: string,
    details?: any,
    statusCode: number = 500,
  ): {
    success: false;
    error: string;
    details?: any;
    statusCode: number;
  } {
    return { success: false, error: message, details, statusCode };
  }
}
