// src/services/token/TokenService.test.ts

import { Container } from 'inversify';

import { TokenService } from './TokenService';
import {
  createMockJwtService,
  createMockConfig,
} from '../../__mocks__/index.js';
import { Config } from '../../cross-cutting/Config/config';
import { TYPES } from '../../utils/types';

describe('TokenService', () => {
  let tokenService: TokenService;
  let mockJwtService: ReturnType<typeof createMockJwtService>;
  let mockConfig: ReturnType<typeof createMockConfig>;
  let container: Container;

  beforeEach(() => {
    // Reset the Config singleton
    Config.resetInstance();

    // Create mock instances
    mockJwtService = createMockJwtService();
    mockConfig = createMockConfig();

    // Set up the DI container
    container = new Container();
    container.bind(TYPES.JwtService).toConstantValue(mockJwtService);
    container.bind(TYPES.Config).toConstantValue(mockConfig);

    // Create an instance of TokenService
    tokenService = container.resolve(TokenService);
  });

  describe('generateAccessToken', () => {
    it('should generate an access token with correct payload and options', () => {
      const payload = { id: '123', email: 'test@example.com' };
      const expectedToken = 'mocked_access_token';
      mockJwtService.sign.mockReturnValue(expectedToken);

      const result = tokenService.generateAccessToken(payload);

      expect(result).toBe(expectedToken);
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        payload,
        mockConfig.JWT_SECRET,
        { expiresIn: mockConfig.ACCESS_TOKEN_EXPIRY },
      );
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a refresh token with correct payload and options', () => {
      const payload = { id: '123' };
      const expectedToken = 'mocked_refresh_token';
      mockJwtService.sign.mockReturnValue(expectedToken);

      const result = tokenService.generateRefreshToken(payload);

      expect(result).toBe(expectedToken);
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        payload,
        mockConfig.REFRESH_TOKEN_SECRET,
        { expiresIn: mockConfig.REFRESH_TOKEN_EXPIRY },
      );
    });
  });

  describe('validateAccessToken', () => {
    it('should validate an access token and return the payload', () => {
      const token = 'valid_access_token';
      const expectedPayload = { id: '123', email: 'test@example.com' };
      mockJwtService.verify.mockReturnValue(expectedPayload);

      const result = tokenService.validateAccessToken(token);

      expect(result).toEqual(expectedPayload);
      expect(mockJwtService.verify).toHaveBeenCalledWith(
        token,
        mockConfig.JWT_SECRET,
      );
    });
  });

  describe('validateRefreshToken', () => {
    it('should validate a refresh token and return the payload', () => {
      const token = 'valid_refresh_token';
      const expectedPayload = { id: '123' };
      mockJwtService.verify.mockReturnValue(expectedPayload);

      const result = tokenService.validateRefreshToken(token);

      expect(result).toEqual(expectedPayload);
      expect(mockJwtService.verify).toHaveBeenCalledWith(
        token,
        mockConfig.REFRESH_TOKEN_SECRET,
      );
    });
  });

  describe('decodeToken', () => {
    it('should decode a token without verification', () => {
      const token = 'some_token';
      const expectedDecodedToken = { id: '123', email: 'test@example.com' };
      mockJwtService.decode.mockReturnValue(expectedDecodedToken);

      const result = tokenService.decodeToken(token);

      expect(result).toEqual(expectedDecodedToken);
      expect(mockJwtService.decode).toHaveBeenCalledWith(token);
    });
  });
});
