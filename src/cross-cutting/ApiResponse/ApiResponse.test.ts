// src/utils/ApiResponse/ApiResponse.test.ts

import { ApiResponse } from './ApiResponse';

describe('ApiResponse', () => {
  let apiResponse: ApiResponse;

  beforeEach(() => {
    apiResponse = new ApiResponse();
  });

  describe('createSuccessResponse', () => {
    it('should create a success response with the provided data', () => {
      const testData = { id: 1, name: 'Test' };
      const result = apiResponse.createSuccessResponse(testData);

      expect(result).toEqual({
        success: true,
        data: {
          id: 1,
          name: 'Test',
        },
      });
    });

    it('should create a success response with an empty object if no data is provided', () => {
      const result = apiResponse.createSuccessResponse({});

      expect(result).toEqual({
        success: true,
        data: {},
      });
    });

    it('should work with different data types', () => {
      expect(apiResponse.createSuccessResponse('string')).toEqual({
        success: true,
        data: 'string',
      });

      expect(apiResponse.createSuccessResponse(123)).toEqual({
        success: true,
        data: 123,
      });

      expect(apiResponse.createSuccessResponse([1, 2, 3])).toEqual({
        success: true,
        data: [1, 2, 3],
      });
    });
  });

  describe('createErrorResponse', () => {
    it('should create an error response with the provided message and default status code', () => {
      const errorMessage = 'An error occurred';
      const result = apiResponse.createErrorResponse(errorMessage);

      expect(result).toEqual({
        success: false,
        error: errorMessage,
        statusCode: 500,
      });
    });

    it('should create an error response with the provided message and status code', () => {
      const errorMessage = 'Not Found';
      const details = {};
      const statusCode = 404;
      const result = apiResponse.createErrorResponse(
        errorMessage,
        details,
        statusCode,
      );

      expect(result).toEqual({
        success: false,
        error: errorMessage,
        details,
        statusCode: statusCode,
      });
    });

    it('should use 500 as default status code if not provided', () => {
      const errorMessage = 'Server Error';
      const result = apiResponse.createErrorResponse(errorMessage);

      expect(result).toEqual({
        success: false,
        error: errorMessage,
        statusCode: 500,
      });
    });
  });
});
