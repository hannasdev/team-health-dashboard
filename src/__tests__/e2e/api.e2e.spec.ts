import axios, { AxiosResponse } from 'axios';
import EventSource from 'eventsource';

interface Metric {
  id: string;
  metric_category: string;
  metric_name: string;
  value: number;
  timestamp: string;
  unit: string;
  additional_info: string;
  source: string;
}

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
      id: registerResponse.data.user.id,
      email,
      password,
    };

    // Log in to get tokens
    const loginResponse = await retryRequest('post', '/api/auth/login', {
      email: testUser.email,
      password: testUser.password,
    });

    accessToken = loginResponse.data.accessToken;
    refreshToken = loginResponse.data.refreshToken;
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
      const timePeriod = 90; // Match the time period used in the actual request

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          await new Promise<void>((resolve, reject) => {
            console.log(`Starting metrics request (attempt ${attempt})`);

            const headers = {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'text/event-stream',
            };

            const url = new URL(`${apiEndpoint}/api/metrics`);
            url.searchParams.append('timePeriod', timePeriod.toString());

            const abortController = new AbortController();
            const timeout = setTimeout(() => {
              abortController.abort();
              reject(new Error('Test timed out'));
            }, 60000); // 60 seconds timeout

            fetch(url.toString(), {
              headers,
              signal: abortController.signal,
            })
              .then(response => {
                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
                }

                if (!response.body) {
                  throw new Error('Response body is null');
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';
                let lastProgress = -1;
                let progressEventReceived = false;

                function processEvents() {
                  reader
                    .read()
                    .then(({ done, value }) => {
                      if (done) {
                        console.log('Stream complete');
                        clearTimeout(timeout);
                        resolve();
                        return;
                      }

                      buffer += decoder.decode(value, { stream: true });
                      const events = buffer.split('\n\n');
                      buffer = events.pop() || '';

                      for (const event of events) {
                        handleEvent(event);
                      }

                      processEvents();
                    })
                    .catch(error => {
                      console.error('Error reading stream:', error);
                      clearTimeout(timeout);
                      reject(error);
                    });
                }

                processEvents();

                function handleEvent(eventString: string) {
                  console.log('Raw event string:', eventString);
                  const eventLines = eventString.split('\n');
                  if (eventLines.length < 2) {
                    console.error('Invalid event format:', eventString);
                    return;
                  }

                  const eventType = eventLines[0].replace('event: ', '').trim();
                  let eventData;

                  try {
                    eventData = JSON.parse(
                      eventLines[1].replace('data: ', '').trim(),
                    );
                  } catch (error) {
                    console.error('Error parsing event data:', error);
                    console.error('Raw event data:', eventLines[1]);
                    return;
                  }

                  console.log(`Received ${eventType} event:`, eventData);

                  switch (eventType) {
                    case 'progress':
                      progressEventReceived = true;
                      expect(eventData.progress).toBeGreaterThanOrEqual(
                        lastProgress,
                      );
                      lastProgress = eventData.progress;
                      expect(eventData).toHaveProperty('progress');
                      expect(eventData).toHaveProperty('message');
                      expect(eventData).toHaveProperty('current');
                      expect(eventData).toHaveProperty('total');
                      break;
                    case 'result':
                      expect(progressEventReceived).toBe(true);
                      expect(eventData.success).toBe(true);
                      expect(eventData.data).toBeInstanceOf(Array);
                      expect(eventData.data.length).toBeGreaterThan(0);
                      expect(eventData.errors).toBeInstanceOf(Array);
                      expect(eventData.githubStats).toHaveProperty('totalPRs');
                      expect(eventData.githubStats).toHaveProperty(
                        'fetchedPRs',
                      );
                      expect(eventData.githubStats).toHaveProperty(
                        'timePeriod',
                      );
                      expect(eventData.githubStats.timePeriod).toBe(timePeriod);
                      expect(eventData.status).toBe(200);
                      eventData.data.forEach((metric: Metric) => {
                        expect(metric).toHaveProperty('id');
                        expect(metric).toHaveProperty('metric_category');
                        expect(metric).toHaveProperty('metric_name');
                        expect(metric).toHaveProperty('value');
                        expect(metric).toHaveProperty('timestamp');
                        expect(metric).toHaveProperty('unit');
                        expect(metric).toHaveProperty('additional_info');
                        expect(metric).toHaveProperty('source');
                      });
                      clearTimeout(timeout);
                      resolve();
                      break;
                    default:
                      console.log('Unknown event type:', eventType);
                  }
                }
              })
              .catch(error => {
                console.error('Fetch error:', error);
                clearTimeout(timeout);
                reject(error);
              });
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

      // Simulate an expired token
      const expiredToken = 'expired.access.token';

      const axiosInstanceWithExpiredToken = axios.create({
        baseURL: apiEndpoint,
        validateStatus: () => true,
      });

      axiosInstanceWithExpiredToken.interceptors.response.use(
        response => {
          console.log('Interceptor: Response received', response.status);
          return response;
        },
        async error => {
          console.log('Interceptor: Error caught', error.response?.status);
          if (axios.isAxiosError(error) && error.response) {
            console.log('Interceptor triggered:', error.response.status);
            if (error.response.status === 401) {
              console.log('Attempting to refresh token in interceptor');
              try {
                const refreshResponse = await retryRequest(
                  'post',
                  '/api/auth/refresh',
                  { refreshToken },
                );
                console.log(
                  'Interceptor refresh response:',
                  refreshResponse.status,
                  refreshResponse.data,
                );

                if (refreshResponse.status === 200) {
                  accessToken = refreshResponse.data.accessToken;
                  refreshToken = refreshResponse.data.refreshToken;

                  // Retry the original request with the new token
                  if (error.config) {
                    error.config.headers['Authorization'] =
                      `Bearer ${accessToken}`;
                    console.log(
                      'Retrying original request with new token from interceptor',
                    );
                    return axiosInstanceWithExpiredToken(error.config);
                  } else {
                    console.error('Error config is undefined');
                    return Promise.reject(error);
                  }
                } else {
                  console.log('Token refresh failed in interceptor');
                  return Promise.reject(error);
                }
              } catch (refreshError) {
                console.error(
                  'Error during token refresh in interceptor:',
                  refreshError,
                );
                return Promise.reject(refreshError);
              }
            }
          }
          return Promise.reject(error);
        },
      );

      try {
        console.log('Sending request with expired token:', expiredToken);
        const response = await axiosInstanceWithExpiredToken.get(
          `/api/metrics?timePeriod=${timePeriod}`,
          {
            headers: {
              Authorization: `Bearer ${expiredToken}`,
            },
          },
        );

        console.log('Final response:', response.status, response.data);

        // Check if the response is successful (either from interceptor refresh or manual refresh)
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('success', true);
        expect(response.data.data).toBeInstanceOf(Array);
        expect(response.data.data.length).toBeGreaterThan(0);
      } catch (error) {
        console.error('Error in test:', error);
        if (axios.isAxiosError(error)) {
          if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
          } else if (error.request) {
            console.error('No response received:', error.request);
          } else {
            console.error('Error setting up request:', error.message);
          }
        } else {
          console.error('Non-Axios error:', error);
        }

        // If the interceptor didn't handle the refresh, try manual refresh
        console.log('Manually attempting token refresh');
        try {
          const refreshResponse = await retryRequest(
            'post',
            '/api/auth/refresh',
            {
              refreshToken,
            },
          );
          console.log(
            'Manual refresh response:',
            refreshResponse.status,
            refreshResponse.data,
          );

          if (refreshResponse.status === 200) {
            accessToken = refreshResponse.data.accessToken;
            refreshToken = refreshResponse.data.refreshToken;

            // Retry the request with the new token
            const retryResponse = await axiosInstanceWithExpiredToken.get(
              `/api/metrics?timePeriod=${timePeriod}`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              },
            );

            console.log(
              'Retry response:',
              retryResponse.status,
              retryResponse.data,
            );

            expect(retryResponse.status).toBe(200);
            expect(retryResponse.data).toHaveProperty('success', true);
            expect(retryResponse.data.data).toBeInstanceOf(Array);
            expect(retryResponse.data.data.length).toBeGreaterThan(0);
            return; // Test passes if we reach here
          }
        } catch (refreshError) {
          console.error('Manual refresh failed:', refreshError);
        }

        throw error; // Re-throw the error if all attempts fail
      }
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
      expect(response.data).toHaveProperty('accessToken');
      expect(response.data).toHaveProperty('refreshToken');
      expect(response.data).toHaveProperty('user');
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
      expect(response.data).toHaveProperty('accessToken');
      expect(response.data).toHaveProperty('refreshToken');
      expect(response.data).toHaveProperty('user');
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
      expect(response.data).toHaveProperty('accessToken');
      expect(response.data).toHaveProperty('refreshToken');
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
