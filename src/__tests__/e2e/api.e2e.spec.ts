import { listenerCount } from 'node:events';

import axios from 'axios';
import EventSource from 'eventsource';

import {
  apiEndpoint,
  retryRequest,
  createTestUser,
  loginUser,
} from './helpers/apiHelpers';
import {
  DEFAULT_TIMEOUT,
  AUTH_ENDPOINTS,
  METRICS_ENDPOINT,
} from './helpers/constants';

jest.setTimeout(DEFAULT_TIMEOUT); // 2 minutes

describe('API E2E Tests', () => {
  let accessToken: string;
  let refreshToken: string;
  let testUser: { id: string; email: string; password: string };

  beforeAll(async () => {
    console.log('Starting E2E tests setup');

    // Wait for the app to be ready
    await retryRequest('get', '/health');
    console.log('App is ready, proceeding with tests');
  }, 60000);

  beforeEach(async () => {
    // Log out any existing user
    if (accessToken && refreshToken) {
      await retryRequest(
        'post',
        AUTH_ENDPOINTS.LOGOUT,
        { refreshToken },
        {
          Authorization: `Bearer ${accessToken}`,
        },
      );
    }

    // Create a new user and log in
    testUser = await createTestUser();
    const { userAccessToken, userRefreshToken } = await loginUser(
      testUser.email,
      testUser.password,
    );
    accessToken = userAccessToken;
    refreshToken = userRefreshToken;
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const { data } = await retryRequest('get', '/health');
      // console.log('health response', data);
      expect(data.data.status).toBe('OK');
    });
  });

  describe('GET /api/metrics', () => {
    it('should allow access for authenticated users and stream data', async () => {
      await streamMetricsData(accessToken, refreshToken, 90);
    }, 100000); // Increase timeout to 100 seconds
  });

  describe('GET /api/metrics with token handling', () => {
    it('should handle token expiration and refresh during metrics retrieval', async () => {
      const expiredToken = 'expired.access.token';
      await streamMetricsData(expiredToken, refreshToken, 7);
    }, 100000); // Increase timeout to 100 seconds
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const uniqueEmail = `testuser_${Date.now()}@example.com`;
      const response = await retryRequest('post', AUTH_ENDPOINTS.REGISTER, {
        email: uniqueEmail,
        password: 'testpassword',
      });

      expect(response.status).toBe(201);
      expect(response.data.data).toHaveProperty('accessToken');
      expect(response.data.data).toHaveProperty('refreshToken');
      expect(response.data.data).toHaveProperty('user');
    });

    it('should handle existing user registration', async () => {
      const response = await retryRequest('post', AUTH_ENDPOINTS.REGISTER, {
        email: 'testuser@example.com',
        password: 'testpassword',
      });
      // console.log('existing user response', response.data);
      expect(response.data.statusCode).toBe(409);
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
      console.log('Full refresh token response:', {
        status: response.status,
        data: response.data,
        headers: response.headers,
      });

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

  describe('Access token usage', () => {
    it('should access a protected route with the new access token', async () => {
      await streamMetricsData(accessToken, refreshToken, 7);
    }, 100000); // Increase timeout to 100 seconds
  });
});

async function streamMetricsData(
  accessToken: string,
  refreshToken: string,
  timePeriod: number,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const abortController = new AbortController();
    const timeout = setTimeout(() => {
      abortController.abort();
      reject(new Error('Test timed out'));
    }, 90000); // 90 seconds timeout

    let eventSource: EventSource | null = null;
    let lastHeartbeat = Date.now();
    let resultReceived = false;

    function handleEvent(event: MessageEvent) {
      console.log(`Received event: ${event.type}`, event.data);

      try {
        const data = JSON.parse(event.data);
        switch (event.type) {
          case 'progress':
            handleProgressEvent(data);
            break;
          case 'result':
            handleResultEvent(data);
            clearTimeout(timeout);
            eventSource?.close();
            resultReceived = true;
            resolve();
            break;
          case 'error':
            handleErrorEvent(data);
            break;
          case 'heartbeat':
            lastHeartbeat = Date.now();
            console.log('Received heartbeat:', data);
            break;
          default:
            console.warn('Unknown event type:', event.type);
        }
      } catch (parseError) {
        console.error(
          'Error parsing event data:',
          parseError,
          'Raw data:',
          event.data,
        );
        handleError(parseError);
      }
    }

    function handleProgressEvent(data: any) {
      expect(data).toHaveProperty('progress');
      expect(data).toHaveProperty('message');
      expect(data).toHaveProperty('current');
      expect(data).toHaveProperty('total');
    }

    function handleResultEvent(data: any) {
      console.log('Received result event:', data);
      try {
        expect(data.success).toBe(true);
        expect(data.data).toHaveProperty('metrics');
        expect(data.data).toHaveProperty('errors');
        expect(data.data).toHaveProperty('githubStats');
        expect(data.data).toHaveProperty('status');
        expect(data.data.status).toBe(200);
        validateMetrics(data.data.metrics);

        console.log('Metrics validation successful');
        clearTimeout(timeout);
        clearInterval(inactivityCheck);
        eventSource?.close();
        resultReceived = true;
        setTimeout(resolve, 1000); // Give a short delay before resolving
      } catch (error) {
        console.error('Error in handleResultEvent:', error);
        handleError(error);
      }
    }

    function handleErrorEvent(data: any) {
      clearTimeout(timeout);
      eventSource?.close();
      reject(new Error(`SSE Error: ${data.error}`));
    }

    function validateMetrics(metrics: any[]) {
      const expectedMetrics = [
        'Cycle Time',
        'WIP Items',
        'Lead Time',
        'Sprint Velocity',
        'Burndown',
        'Code Review Time',
        'PR Size (avg)',
        'Build Success',
        'Bug Resolution',
        'Goal Achievement',
        'Happiness Index',
        'Pull Request Count',
        'Average Time to Merge',
        'Average PR Size',
      ];
      expectedMetrics.forEach(metricName => {
        expect(metrics.some(m => m.metric_name === metricName)).toBe(true);
      });
    }

    function handleError(error: unknown) {
      console.error('SSE Error:', error);
      clearTimeout(timeout);
      eventSource?.close();
      reject(error);
    }

    function connect(token: string) {
      if (eventSource) {
        eventSource.close();
      }

      const url = `${apiEndpoint}${METRICS_ENDPOINT}?timePeriod=${timePeriod}`;
      const headers = { Authorization: `Bearer ${token}` };

      console.log('Connecting to SSE with URL:', url);
      eventSource = new EventSource(url, { headers });

      eventSource.onopen = () => console.log('SSE connection opened');

      eventSource.onerror = (error: Event) => {
        console.error('SSE connection error:', error);
        if (eventSource?.readyState === EventSource.CLOSED) {
          console.log('SSE connection closed');
          if (resultReceived) {
            console.log('Operation completed successfully');
            resolve();
          } else {
            if ((error as any).status === 401) {
              refreshTokenAndReconnect();
            } else {
              handleError(new Error('SSE connection closed unexpectedly'));
            }
          }
        }
      };

      eventSource.onmessage = event => {
        console.log('Received SSE message:', event.type, event.data);
        handleEvent(event);
      };
    }

    async function refreshTokenAndReconnect() {
      try {
        const refreshResponse = await retryRequest(
          'post',
          AUTH_ENDPOINTS.REFRESH,
          { refreshToken },
        );
        if (refreshResponse.status === 200 && refreshResponse.data.data) {
          accessToken = refreshResponse.data.data.accessToken;
          refreshToken = refreshResponse.data.data.refreshToken;
          console.log('Token refreshed successfully');
          connect(accessToken);
        } else {
          throw new Error('Failed to refresh token');
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        handleError(refreshError);
      }
    }

    // Check for inactivity
    const inactivityCheck = setInterval(() => {
      if (resultReceived) {
        clearInterval(inactivityCheck);
        return;
      }
      if (Date.now() - lastHeartbeat > 60000) {
        console.error('No heartbeat received for 60 seconds');
        clearInterval(inactivityCheck);
        if (!resultReceived) {
          handleError(new Error('SSE connection inactive'));
        }
      }
    }, 5000);

    connect(accessToken);

    return () => {
      clearTimeout(timeout);
      clearInterval(inactivityCheck);
      eventSource?.close();
    };
  });
}
