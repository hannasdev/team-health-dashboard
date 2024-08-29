import axios, { AxiosResponse } from 'axios';
import EventSource from 'eventsource';

jest.setTimeout(120000); // 2 minutes

const apiEndpoint = 'http://app-test:3000';

describe('API E2E Tests', () => {
  let accessToken: string;
  let refreshToken: string;
  let testUser: { id: string; email: string; password: string };

  const axiosInstance = axios.create({
    baseURL: apiEndpoint,
    validateStatus: () => true,
  });

  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const retryRequest = async (
    method: 'get' | 'post',
    url: string,
    body?: any,
    headers?: any,
    maxRetries = 5,
    delay = 1000,
  ): Promise<AxiosResponse> => {
    let lastError: unknown;
    for (let i = 0; i < maxRetries; i++) {
      try {
        console.log(`Attempt ${i + 1} for ${method.toUpperCase()} ${url}`);
        const response = await axiosInstance({
          method,
          url,
          data: body,
          headers,
        });
        console.log(
          `${method.toUpperCase()} ${url} successful. Status: ${response.status}`,
        );
        return response;
      } catch (error: unknown) {
        lastError = error;
        console.error(
          `Attempt ${i + 1} failed for ${method.toUpperCase()} ${url}:`,
          error instanceof Error ? error.message : 'Unknown error',
        );
        if (i === maxRetries - 1) break;
        console.log(`Retrying in ${delay}ms...`);
        await wait(delay);
      }
    }

    throw new Error(
      `Max retries reached for ${method.toUpperCase()} ${url}: ${
        lastError instanceof Error ? lastError.message : 'Unknown error'
      }`,
    );
  };

  beforeAll(async () => {
    console.log('Starting E2E tests setup');

    // Wait for the app to be ready
    await retryRequest('get', '/health');
    console.log('App is ready, proceeding with tests');

    // Create a test user
    const email = `testuser_${Date.now()}@example.com`;
    const password = 'testpassword';
    const registerResponse = await retryRequest('post', '/api/auth/register', {
      email,
      password,
    });
    testUser = {
      id: registerResponse.data.data.user.id,
      email,
      password,
    };

    // Log in to get tokens
    const loginResponse = await retryRequest('post', '/api/auth/login', {
      email: testUser.email,
      password: testUser.password,
    });

    accessToken = loginResponse.data.data.accessToken;
    refreshToken = loginResponse.data.data.refreshToken;
    console.log('Tokens acquired successfully');
  }, 60000);

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await retryRequest('get', '/health');
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/json/);
      expect(response.data).toHaveProperty('status');
    });
  });

  describe('GET /api/metrics', () => {
    it('should deny access for unauthenticated users', async () => {
      const response = await retryRequest('get', '/api/metrics');
      expect(response.status).toBe(401);
      expect(response.headers['content-type']).toMatch(/json/);
      expect(response.data).toHaveProperty('error', 'No token provided');
    });

    it('should allow access for authenticated users and stream data', async () => {
      const maxRetries = 3;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          await new Promise<void>((resolve, reject) => {
            // Specify Promise<void> here
            const timePeriod = 7;
            console.log(`Starting metrics request (attempt ${attempt})`);

            const headers = {
              Authorization: `Bearer ${accessToken}`,
            };

            const url = new URL(`${apiEndpoint}/api/metrics`);
            url.searchParams.append('timePeriod', timePeriod.toString());

            const es = new EventSource(url.toString(), { headers });

            let progressReceived = false;
            let resultReceived = false;
            let heartbeatReceived = false;

            const checkCompletion = () => {
              if (progressReceived && resultReceived) {
                console.log('Test completed successfully');
                es.close();
                resolve(); // This should now work without type errors
              }
            };

            es.onopen = () => {
              console.log('EventSource connection opened');
            };

            es.onmessage = event => {
              console.log('Received event:', event);
              try {
                const data = JSON.parse(event.data);
                console.log('Parsed event data:', data);

                switch (event.type) {
                  case 'progress':
                    progressReceived = true;
                    console.log('Progress event received:', data);
                    break;
                  case 'result':
                    resultReceived = true;
                    console.log('Result event received:', data);
                    expect(data.success).toBe(true);
                    expect(data.data).toBeInstanceOf(Array);
                    checkCompletion();
                    break;
                  case 'heartbeat':
                    heartbeatReceived = true;
                    console.log('Heartbeat event received:', data);
                    break;
                  default:
                    console.log('Unknown event type received:', event.type);
                }
              } catch (error) {
                console.error('Error parsing event data:', error);
                es.close();
                reject(error);
              }
            };

            es.onerror = err => {
              console.error(`EventSource error (attempt ${attempt}):`, err);
              es.close();
              if (attempt === maxRetries) {
                reject(new Error(`EventSource error: ${JSON.stringify(err)}`));
              }
            };

            setTimeout(() => {
              if (!resultReceived) {
                console.error(`Test timed out (attempt ${attempt})`);
                es.close();
                if (attempt === maxRetries) {
                  reject(
                    new Error('Test timed out without receiving a result'),
                  );
                }
              }
            }, 30000); // 30 seconds timeout per attempt
          });

          // If we reach here, the test passed
          return;
        } catch (error) {
          console.error(`Attempt ${attempt} failed:`, error);
          if (attempt === maxRetries) {
            throw error;
          }
          await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retrying
        }
      }
    });

    it('should handle server errors gracefully', async () => {
      const response = await retryRequest(
        'get',
        '/api/metrics?error=true',
        null,
        {
          Authorization: `Bearer ${accessToken}`,
        },
      );

      expect(response.status).toBe(500);
      expect(response.data).toHaveProperty('error');
    });
  });

  describe('GET /api/metrics with token handling', () => {
    it('should handle token expiration and refresh during metrics retrieval', async () => {
      const timePeriod = 7;
      let tokenRefreshed = false;

      // CHANGED: Use a custom axios instance with an interceptor to simulate token expiration
      const axiosInstanceWithExpiredToken = axios.create({
        baseURL: apiEndpoint,
        validateStatus: () => true,
      });

      axiosInstanceWithExpiredToken.interceptors.response.use(
        response => response,
        async error => {
          if (
            error.response &&
            error.response.status === 401 &&
            !tokenRefreshed
          ) {
            tokenRefreshed = true;
            // Refresh the token
            const refreshResponse = await retryRequest(
              'post',
              '/api/auth/refresh',
              { refreshToken },
            );
            accessToken = refreshResponse.data.data.accessToken;
            refreshToken = refreshResponse.data.data.refreshToken;

            // Retry the original request with the new token
            error.config.headers['Authorization'] = `Bearer ${accessToken}`;
            return axiosInstanceWithExpiredToken(error.config);
          }
          return Promise.reject(error);
        },
      );

      const response = await axiosInstanceWithExpiredToken.get(
        `/api/metrics?timePeriod=${timePeriod}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      expect(response.status).toBe(200);
      expect(tokenRefreshed).toBe(true);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data.data).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const uniqueEmail = `testuser_${Date.now()}@example.com`;
      const response = await retryRequest('post', '/api/auth/register', {
        email: uniqueEmail,
        password: 'testpassword',
      });

      expect(response.status).toBe(201);
      expect(response.data.data).toHaveProperty('accessToken');
      expect(response.data.data).toHaveProperty('refreshToken');
      expect(response.data.data).toHaveProperty('user');
    });

    it('should handle existing user registration', async () => {
      const response = await retryRequest('post', '/api/auth/register', {
        email: 'testuser@example.com',
        password: 'testpassword',
      });

      expect(response.status).toBe(409);
      expect(response.headers['content-type']).toMatch(/json/);
      expect(response.data).toHaveProperty('error', 'User already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should log in a registered user', async () => {
      const response = await retryRequest('post', '/api/auth/login', {
        email: testUser.email,
        password: testUser.password,
      });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/json/);
      expect(response.data.data).toHaveProperty('accessToken');
      expect(response.data.data).toHaveProperty('refreshToken');
      expect(response.data.data).toHaveProperty('user');
    });

    it('should handle invalid login credentials', async () => {
      const response = await retryRequest('post', '/api/auth/login', {
        email: 'wrong@example.com',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
      expect(response.headers['content-type']).toMatch(/json/);
      expect(response.data).toHaveProperty('error', 'Invalid credentials');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh the access token with a valid refresh token', async () => {
      const response = await retryRequest('post', '/api/auth/refresh', {
        refreshToken,
      });

      expect(response.status).toBe(200);
      expect(response.data.data).toHaveProperty('accessToken');
      expect(response.data.data).toHaveProperty('refreshToken');
    });

    it('should reject an invalid refresh token', async () => {
      const response = await retryRequest('post', '/api/auth/refresh', {
        refreshToken: 'invalid-refresh-token',
      });

      expect(response.status).toBe(401);
      expect(response.data).toHaveProperty('error', 'Invalid refresh token');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should log out the user and invalidate the refresh token', async () => {
      const response = await retryRequest(
        'post',
        '/api/auth/logout',
        { refreshToken },
        {
          Authorization: `Bearer ${accessToken}`,
        },
      );

      expect(response.status).toBe(204);

      // Try to use the logged out refresh token
      const refreshResponse = await retryRequest('post', '/api/auth/refresh', {
        refreshToken,
      });

      expect(refreshResponse.status).toBe(401);
      // CHANGED: Update expected error message
      expect(refreshResponse.data).toHaveProperty(
        'error',
        'Refresh token has been revoked',
      );
    });
  });

  describe('Access token usage', () => {
    it('should access a protected route with the new access token', async () => {
      const response = await retryRequest('get', '/api/metrics', null, {
        Authorization: `Bearer ${accessToken}`,
      });

      expect(response.status).toBe(200);
      // Check for the start of the event stream
      expect(response.headers['content-type']).toMatch(/^text\/event-stream/);
    });
  });
});
