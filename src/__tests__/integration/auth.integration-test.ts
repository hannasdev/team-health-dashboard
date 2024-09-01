// src/__tests__/integration/auth.integration.test.ts
import { Container } from 'inversify';
import request from 'supertest';

import {
  createMockAuthenticationService,
  createMockLogger,
  MockMongoDbClient,
  MockGitHubAdapter,
  MockGoogleSheetsAdapter,
  createMockUserService,
} from '../../__mocks__/index.js';
import { setupContainer } from '../../container.js';
import { TYPES } from '../../utils/types.js';

import type {
  IAuthenticationService,
  ITeamHealthDashboardApp,
  IUserService,
} from '../../interfaces/index.js';
import type { Express } from 'express';

// Mock @octokit/graphql
jest.mock('@octokit/graphql', () => ({
  graphql: jest.fn().mockResolvedValue({
    /* mock response */
  }),
}));

describe('Auth Integration Tests', () => {
  let app: Express;
  let testContainer: Container;
  let mockAuthService: jest.Mocked<IAuthenticationService>;
  let mockUserService: jest.Mocked<IUserService>;

  beforeAll(async () => {
    mockAuthService = createMockAuthenticationService();
    mockUserService = createMockUserService();
    const mockLogger = createMockLogger();
    const mockMongoDbClient = new MockMongoDbClient();
    const mockGitHubAdapter = new MockGitHubAdapter();
    const mockGoogleSheetsAdapter = new MockGoogleSheetsAdapter();

    testContainer = setupContainer({
      [TYPES.AuthenticationService.toString()]: mockAuthService,
      [TYPES.Logger.toString()]: mockLogger,
      [TYPES.MongoDbClient.toString()]: mockMongoDbClient,
      [TYPES.GitHubClient.toString()]: mockGitHubAdapter,
      [TYPES.GoogleSheetsClient.toString()]: mockGoogleSheetsAdapter,
    });

    const teamHealthDashboardApp = testContainer.get<ITeamHealthDashboardApp>(
      TYPES.TeamHealthDashboardApp,
    );
    await teamHealthDashboardApp.initialize({ skipDatabaseConnection: true });
    app = teamHealthDashboardApp.expressApp;
  }, 60000);

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = { email: 'test@example.com', password: 'password123' };
      mockUserService.registerUser.mockResolvedValueOnce({
        user: { id: '1', email: userData.email },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      } as any);

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should return an error if registration fails', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
      };
      mockUserService.registerUser.mockRejectedValueOnce(
        new Error('User already exists'),
      );

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should log in a user successfully', async () => {
      const loginData = { email: 'user@example.com', password: 'password123' };
      mockAuthService.login.mockResolvedValueOnce({
        user: { id: '1', email: loginData.email },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      } as any);

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should return an error for invalid credentials', async () => {
      const loginData = {
        email: 'wrong@example.com',
        password: 'wrongpassword',
      };
      mockAuthService.login.mockRejectedValueOnce(
        new Error('Invalid credentials'),
      );

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should log out a user successfully', async () => {
      const logoutData = { refreshToken: 'valid-refresh-token' };
      mockAuthService.logout.mockResolvedValueOnce(undefined);

      const response = await request(app)
        .post('/api/auth/logout')
        .send(logoutData)
        .expect(204);

      expect(response.body).toEqual({});
    });

    it('should return an error if logout fails', async () => {
      const logoutData = { refreshToken: 'invalid-refresh-token' };
      mockAuthService.logout.mockRejectedValueOnce(
        new Error('Invalid refresh token'),
      );

      const response = await request(app)
        .post('/api/auth/logout')
        .send(logoutData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid refresh token');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh tokens successfully', async () => {
      const refreshData = { refreshToken: 'valid-refresh-token' };
      mockAuthService.refreshToken.mockResolvedValueOnce({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .send(refreshData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBe('new-access-token');
      expect(response.body.data.refreshToken).toBe('new-refresh-token');
    });

    it('should return an error for invalid refresh token', async () => {
      const refreshData = { refreshToken: 'invalid-refresh-token' };
      mockAuthService.refreshToken.mockRejectedValueOnce(
        new Error('Invalid refresh token'),
      );

      const response = await request(app)
        .post('/api/auth/refresh')
        .send(refreshData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid refresh token');
    });
  });
});
