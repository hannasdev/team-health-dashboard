import {
  retryRequest,
  createTestUser,
  loginUser,
  wait,
} from './helpers/apiHelpers';
import { AUTH_ENDPOINTS } from './helpers/constants';
import { HeaderKeys } from '../../types/index.js';

describe('E2E Auth', () => {
  let accessToken: string;
  let refreshToken: string;
  let testUser: { id: string; email: string; password: string };

  beforeAll(async () => {
    console.log('Starting E2E Auth tests setup');

    // Wait for the app to be ready
    await retryRequest('get', '/health');
    console.log('App is ready, proceeding with tests');
  }, 60000);

  beforeEach(async () => {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        testUser = await createTestUser();
        const result = await loginUser(testUser.email, testUser.password);

        if (result.userAccessToken && result.userRefreshToken) {
          accessToken = result.userAccessToken;
          refreshToken = result.userRefreshToken;
          break;
        }
      } catch (error) {
        attempts++;
        if (attempts === maxAttempts) {
          throw error;
        }
        // Wait for a bit before retrying
        await wait(5000 * attempts); // Increasing delay with each attempt
      }
    }
  }, 30000); // Increased timeout

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const uniqueEmail = `testuser_${Date.now()}@example.com`;
      const response = await retryRequest('post', AUTH_ENDPOINTS.REGISTER, {
        email: uniqueEmail,
        password: 'testpassword',
      });
      // console.log('should register a new user', response.data);
      expect(response.status).toBe(201);
      expect(response.data.data).toHaveProperty('accessToken');
      expect(response.data.data).toHaveProperty('refreshToken');
      expect(response.data.data).toHaveProperty('user');
    });

    it('should handle existing user registration', async () => {
      try {
        const response = await retryRequest('post', AUTH_ENDPOINTS.REGISTER, {
          email: testUser.email,
          password: testUser.password,
        });
        console.log('existing user response', response.data);
        expect(response.status).toBe(409);
        expect(response.data.error).toBe('User already exists');
      } catch (error) {
        console.error('Error in existing user registration test:', error);
        throw error;
      }
    });
  });

  describe('POST /api/auth/login', () => {
    it('should log in a registered user', async () => {
      const response = await retryRequest('post', AUTH_ENDPOINTS.LOGIN, {
        email: testUser.email,
        password: testUser.password,
      });

      expect(response.status).toBe(200);
      expect(response.headers[HeaderKeys.CONTENT_TYPE.toLowerCase()]).toMatch(
        /json/,
      );
      expect(response.data.data).toHaveProperty('accessToken');
      expect(response.data.data).toHaveProperty('refreshToken');
      expect(response.data.data).toHaveProperty('user');
    });

    it('should handle invalid login credentials', async () => {
      const response = await retryRequest('post', AUTH_ENDPOINTS.LOGIN, {
        email: 'wrong@example.com',
        password: 'wrongpassword',
      });
      // console.log('invalid credentials response', response.data);

      expect(response.data.statusCode).toBe(401);
      expect(response.data).toHaveProperty('error', 'Invalid credentials');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh the access token with a valid refresh token', async () => {
      const response = await retryRequest('post', AUTH_ENDPOINTS.REFRESH, {
        refreshToken,
      });
      // console.log('Full refresh token response:', {
      //   status: response.status,
      //   data: response.data,
      //   headers: response.headers,
      // });

      expect(response.status).toBe(200);
      expect(response.data.data).toHaveProperty('accessToken');
      expect(response.data.data).toHaveProperty('refreshToken');
    });

    it('should reject an invalid refresh token', async () => {
      const response = await retryRequest('post', AUTH_ENDPOINTS.REFRESH, {
        refreshToken: 'invalid-refresh-token',
      });
      // console.log('reject invalid token response', response.data);

      expect(response.data.statusCode).toBe(401);
      expect(response.data).toHaveProperty('error', 'Invalid refresh token');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should log out the user and invalidate the refresh token', async () => {
      const response = await retryRequest(
        'post',
        AUTH_ENDPOINTS.LOGOUT,
        { refreshToken },
        {
          Authorization: `Bearer ${accessToken}`,
        },
      );

      // console.log('logout user response', response);

      expect(response.status).toBe(204);

      // Try to use the logged out refresh token
      const refreshResponse = await retryRequest(
        'post',
        AUTH_ENDPOINTS.REFRESH,
        {
          refreshToken,
        },
      );
      // console.log('logout user response', refreshResponse);

      expect(refreshResponse.status).toBe(401);

      expect(refreshResponse.data).toHaveProperty(
        'error',
        'Refresh token has been revoked',
      );
    });
  });
});
