// src/interfaces/IApiResponse.ts
export interface IApiResponse {
  createSuccessResponse: <T>(data: T) => { success: true; data: T };
  createErrorResponse: (
    message: string,
    details?: any,
    statusCode?: number,
  ) => {
    success: false;
    error: string;
    details?: any;
    statusCode?: number;
  };
}
