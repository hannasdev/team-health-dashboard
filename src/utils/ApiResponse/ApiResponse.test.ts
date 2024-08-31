// src/utils/ApiResponse.test.ts

import { createSuccessResponse, createErrorResponse } from './ApiResponse';

describe('ApiResponse', () => {
  describe('createSuccessResponse', () => {
    it('should create a success response with the provided data', () => {
      const testData = { id: 1, name: 'Test' };
      const result = createSuccessResponse(testData);

      expect(result).toEqual({
        success: true,
        id: 1,
        name: 'Test',
      });
    });

    it('should create a success response with an empty object if no data is provided', () => {
      const result = createSuccessResponse({});

      expect(result).toEqual({
        success: true,
      });
    });
  });

  describe('createErrorResponse', () => {
    it('should create an error response with the provided message and default status code', () => {
      const errorMessage = 'An error occurred';
      const result = createErrorResponse(errorMessage);

      expect(result).toEqual({
        success: false,
        error: errorMessage,
        statusCode: 500,
      });
    });

    it('should create an error response with the provided message and status code', () => {
      const errorMessage = 'Not Found';
      const statusCode = 404;
      const result = createErrorResponse(errorMessage, statusCode);

      expect(result).toEqual({
        success: false,
        error: errorMessage,
        statusCode: statusCode,
      });
    });
  });
});
