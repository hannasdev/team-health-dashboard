import axios from 'axios';
import EventSource from 'eventsource';

import { retryRequest, createTestUser, loginUser } from './helpers/apiHelpers';
import {
  DEFAULT_TIMEOUT,
  AUTH_ENDPOINTS,
  METRICS_ENDPOINT,
} from './helpers/constants';

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

interface MetricsResponse {
  success: boolean;
  data: Array<{
    id: string;
    metric_category: string;
    metric_name: string;
    value: number;
    timestamp: string;
    unit: string;
    additional_info: string;
    source: string;
  }>;
  errors: string[];
  githubStats: {
    totalPRs: number;
    fetchedPRs: number;
    timePeriod: number;
  };
  status: number;
}

jest.setTimeout(DEFAULT_TIMEOUT); // 2 minutes

const apiEndpoint = 'http://app-test:3000';

describe('API E2E Tests', () => {
  let accessToken: string;
  let refreshToken: string;
  let testUser: { id: string; email: string; password: string };

  beforeAll(async () => {
    console.log('Starting E2E tests setup');

    // Wait for the app to be ready
    await retryRequest('get', '/health');
    console.log('App is ready, proceeding with tests');

    // Create a test user
    testUser = await createTestUser();

    // Log in to get tokens
    const { userAccessToken, userRefreshToken } = await loginUser(
      testUser.email,
      testUser.password,
    );

    accessToken = userAccessToken;
    refreshToken = userRefreshToken;
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
      const response = await retryRequest('get', METRICS_ENDPOINT);
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
            // console.log(`Starting metrics request (attempt ${attempt})`);

            const headers = {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'text/event-stream',
            };

            const url = new URL(`${apiEndpoint}${METRICS_ENDPOINT}`);
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
                        // console.log('Stream complete');
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
                      // console.error('Error reading stream:', error);
                      clearTimeout(timeout);
                      reject(error);
                    });
                }

                processEvents();

                function handleEvent(eventString: string) {
                  // console.log('Raw event string:', eventString);
                  const eventLines = eventString.split('\n');
                  if (eventLines.length < 2) {
                    // console.error('Invalid event format:', eventString);
                    return;
                  }

                  const eventType = eventLines[0].replace('event: ', '').trim();
                  let eventData;

                  try {
                    eventData = JSON.parse(
                      eventLines[1].replace('data: ', '').trim(),
                    );
                  } catch (error) {
                    // console.error('Error parsing event data:', error);
                    // console.error('Raw event data:', eventLines[1]);
                    return;
                  }

                  // console.log(`Received ${eventType} event:`, eventData);

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
          // console.error(`Attempt ${attempt} failed:`, error);
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

      // First request with expired token
      // console.log('Sending request with expired token:', expiredToken);
      const initialResponse = await axiosInstanceWithExpiredToken.get(
        `${METRICS_ENDPOINT}?timePeriod=${timePeriod}`,
        {
          headers: {
            Authorization: `Bearer ${expiredToken}`,
          },
        },
      );

      // console.log(
      //   'Initial response:',
      //   initialResponse.status,
      //   initialResponse.data,
      // );

      // Check if the initial request failed as expected
      expect(initialResponse.status).toBe(401);
      expect(initialResponse.data).toHaveProperty('error', 'No token provided');

      // Now try to refresh the token
      // console.log('Attempting to refresh token');
      const refreshResponse = await retryRequest(
        'post',
        AUTH_ENDPOINTS.REFRESH,
        {
          refreshToken,
        },
      );

      // console.log(
      //   'Refresh response:',
      //   refreshResponse.status,
      //   refreshResponse.data,
      // );

      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.data).toHaveProperty('accessToken');
      expect(refreshResponse.data).toHaveProperty('refreshToken');

      // Update the tokens
      accessToken = refreshResponse.data.accessToken;
      refreshToken = refreshResponse.data.refreshToken;

      // Try the request again with the new token
      const retryResponse: MetricsResponse = await new Promise(
        (resolve, reject) => {
          const eventSource = new EventSource(
            `${apiEndpoint}${METRICS_ENDPOINT}?timePeriod=${timePeriod}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            },
          );

          let fullData = '';

          eventSource.onmessage = event => {
            fullData += event.data;
          };

          eventSource.onerror = error => {
            eventSource.close();
            reject(error);
          };

          eventSource.addEventListener('result', event => {
            eventSource.close();
            resolve(JSON.parse(event.data) as MetricsResponse);
          });
        },
      );

      console.log('Retry response:', retryResponse);

      // Check if the retry was successful
      expect(retryResponse).toHaveProperty('success', true);
      expect(retryResponse.data).toBeInstanceOf(Array);
      expect(retryResponse.data.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const uniqueEmail = `testuser_${Date.now()}@example.com`;
      const response = await retryRequest('post', AUTH_ENDPOINTS.REGISTER, {
        email: uniqueEmail,
        password: 'testpassword',
      });

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('accessToken');
      expect(response.data).toHaveProperty('refreshToken');
      expect(response.data).toHaveProperty('user');
    });

    it('should handle existing user registration', async () => {
      const response = await retryRequest('post', AUTH_ENDPOINTS.REGISTER, {
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
      const response = await retryRequest('post', AUTH_ENDPOINTS.LOGIN, {
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
      const response = await retryRequest('post', AUTH_ENDPOINTS.LOGIN, {
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
      const response = await retryRequest('post', AUTH_ENDPOINTS.REFRESH, {
        refreshToken,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('accessToken');
      expect(response.data).toHaveProperty('refreshToken');
    });

    it('should reject an invalid refresh token', async () => {
      const response = await retryRequest('post', AUTH_ENDPOINTS.REFRESH, {
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
        AUTH_ENDPOINTS.LOGOUT,
        { refreshToken },
        {
          Authorization: `Bearer ${accessToken}`,
        },
      );

      expect(response.status).toBe(204);

      // Try to use the logged out refresh token
      const refreshResponse = await retryRequest(
        'post',
        AUTH_ENDPOINTS.REFRESH,
        {
          refreshToken,
        },
      );

      expect(refreshResponse.status).toBe(401);

      expect(refreshResponse.data).toHaveProperty(
        'error',
        'Refresh token has been revoked',
      );
    });
  });

  describe('Access token usage', () => {
    it('should access a protected route with the new access token', async () => {
      const response = await retryRequest('get', METRICS_ENDPOINT, null, {
        Authorization: `Bearer ${accessToken}`,
      });

      expect(response.status).toBe(200);
      // Check for the start of the event stream
      expect(response.headers['content-type']).toMatch(/^text\/event-stream/);
    });
  });
});
