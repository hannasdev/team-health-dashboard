import {
  retryRequest,
  createTestUser,
  loginUser,
  refreshAccessToken,
} from './helpers/apiHelpers';
import { METRICS_ENDPOINTS } from './helpers/constants';
import { HeaderKeys } from '../../types/index.js';

interface MetricsResponse {
  data: {
    metrics: any[];
    githubStats: {
      totalPRs: number;
      fetchedPRs: number;
      timePeriod: number;
    };
    totalMetrics: number;
  };
}

interface SyncResponse {
  data: {
    message: string;
  };
}

interface ErrorResponse {
  message: string;
  details?: any;
  statusCode: number;
}

interface ResetDatabaseResponse {
  data: {
    message: string;
  };
}

describe('E2E Metrics', () => {
  let accessToken: string;
  let refreshToken: string;
  let testUser: { id: string; email: string; password: string };

  beforeAll(async () => {
    console.log('Starting E2E Metrics tests setup');
    await retryRequest('get', '/health');
    console.log('App is ready, proceeding with tests');
  }, 60000);

  beforeEach(async () => {
    testUser = await createTestUser();
    const result = await loginUser(testUser.email, testUser.password);

    if (result.userAccessToken && result.userRefreshToken) {
      accessToken = result.userAccessToken;
      refreshToken = result.userRefreshToken;
    } else {
      throw new Error('Failed to obtain access or refresh token');
    }
  });

  const runTest = async (testName: string, testFn: () => Promise<void>) => {
    console.group(testName);
    try {
      await testFn();
      console.log('✓ Test passed');
    } catch (error) {
      console.error('✕ Test failed');
      console.error('Error:', error);
      throw error;
    } finally {
      console.groupEnd();
    }
  };

  describe('GET /api/metrics', () => {
    it('should retrieve metrics with valid authentication', () =>
      runTest('Retrieve metrics', async () => {
        const response = await retryRequest(
          'get',
          METRICS_ENDPOINTS.GET_METRICS,
          null,
          { Authorization: `Bearer ${accessToken}` },
        );

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        console.log('Response data:', JSON.stringify(response.data, null, 2));

        expect(response.status).toBe(200);
        expect(response.headers[HeaderKeys.CONTENT_TYPE.toLowerCase()]).toMatch(
          /json/,
        );
        expect(response.data).toBeDefined();
        expect(response.data.data).toBeDefined();
        expect(response.data.data).toHaveProperty('metrics');
        expect(response.data.data).toHaveProperty('githubStats');
        expect(response.data.data).toHaveProperty('totalMetrics');
      }));

    it('should return well-formed metric objects', () =>
      runTest('Well-formed metrics', async () => {
        const response = await retryRequest(
          'get',
          METRICS_ENDPOINTS.GET_METRICS,
          null,
          { Authorization: `Bearer ${accessToken}` },
        );

        console.log('Response data:', JSON.stringify(response.data, null, 2));

        expect(response.status).toBe(200);
        expect(response.data.data.metrics.length).toBeGreaterThan(0);

        const sampleMetric = response.data.data.metrics[0];
        console.log('Sample metric:', sampleMetric);

        expect(sampleMetric).toHaveProperty('_id');
        expect(sampleMetric).toHaveProperty('metric_category');
        expect(sampleMetric).toHaveProperty('metric_name');
        expect(sampleMetric).toHaveProperty('value');
        expect(sampleMetric).toHaveProperty('timestamp');
        expect(sampleMetric).toHaveProperty('unit');
        expect(sampleMetric).toHaveProperty('source');
      }));

    it('should handle pagination correctly', () =>
      runTest('Correct Pagination', async () => {
        const page = 1;
        const pageSize = 10;
        const response = await retryRequest<MetricsResponse>(
          'get',
          `${METRICS_ENDPOINTS.GET_METRICS}?page=${page}&pageSize=${pageSize}`,
          null,
          {
            Authorization: `Bearer ${accessToken}`,
          },
        );

        console.log(
          'GET /api/metrics with pagination response:',
          JSON.stringify(response.data, null, 2),
        );

        expect(response.status).toBe(200);
        expect(response.data).not.toBeNull();
        expect(response.data.data).not.toBeNull();
        expect(response.data.data.metrics).toBeDefined();
        expect(Array.isArray(response.data.data.metrics)).toBeTruthy();
        expect(response.data.data.metrics.length).toBeLessThanOrEqual(pageSize);
      }));

    it('should handle invalid pagination parameters', () =>
      runTest('Invalid Pagination Params', async () => {
        const response = await retryRequest<ErrorResponse>(
          'get',
          `${METRICS_ENDPOINTS.GET_METRICS}?page=-1&pageSize=0`,
          null,
          {
            Authorization: `Bearer ${accessToken}`,
          },
        );

        console.log(
          'Response:',
          response.status,
          JSON.stringify(response.data, null, 2),
        );

        expect(response.status).toBe(400);
        expect(response.data).toHaveProperty(
          'error',
          'Invalid pagination parameters',
        );
        expect(response.data).toHaveProperty('statusCode', 400);
      }));

    it('should reject requests without authentication', () =>
      runTest('Reject Unauthenticated', async () => {
        const response = await retryRequest<ErrorResponse>(
          'get',
          METRICS_ENDPOINTS.GET_METRICS,
        );

        console.log(
          'Response:',
          response.status,
          JSON.stringify(response.data, null, 2),
        );

        expect(response.status).toBe(401);
        expect(response.data).toHaveProperty('error', 'No token provided');
        expect(response.data).toHaveProperty('statusCode', 401);
        expect(response.data.details).toHaveProperty(
          'errorCode',
          'ERR_UNAUTHORIZED',
        );
      }));

    it('should respond within acceptable time limits', () =>
      runTest('Acceptable Time Limits', async () => {
        const startTime = Date.now();
        await retryRequest<MetricsResponse>(
          'get',
          METRICS_ENDPOINTS.GET_METRICS,
          null,
          {
            Authorization: `Bearer ${accessToken}`,
          },
        );
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        expect(responseTime).toBeLessThan(2000); // 2 seconds, adjust as needed
      }));

    it('should handle token refresh', () =>
      runTest('Token Refresh', async () => {
        // Simulate an expired token
        const expiredToken = 'expired_token';

        // First request with expired token
        const firstResponse = await retryRequest<ErrorResponse>(
          'get',
          METRICS_ENDPOINTS.GET_METRICS,
          null,
          {
            Authorization: `Bearer ${expiredToken}`,
          },
        );

        expect(firstResponse.status).toBe(401);

        // Refresh token (you'll need to implement this helper function)
        const newAccessToken = await refreshAccessToken(refreshToken);

        // Second request with new token
        const secondResponse = await retryRequest<MetricsResponse>(
          'get',
          METRICS_ENDPOINTS.GET_METRICS,
          null,
          {
            Authorization: `Bearer ${newAccessToken}`,
          },
        );

        expect(secondResponse.status).toBe(200);
      }));

    it('should handle concurrent requests', () =>
      runTest('Concurrent Requests', async () => {
        const concurrentRequests = 5;
        const requests = Array(concurrentRequests)
          .fill(null)
          .map(() =>
            retryRequest<MetricsResponse>(
              'get',
              METRICS_ENDPOINTS.GET_METRICS,
              null,
              {
                Authorization: `Bearer ${accessToken}`,
              },
            ),
          );

        const responses = await Promise.all(requests);

        responses.forEach(response => {
          expect(response.status).toBe(200);
          expect(response.data.data.metrics.length).toBeGreaterThan(0);
        });
      }));
  });

  describe('POST /api/metrics/sync', () => {
    it('should trigger metrics sync with valid authentication', () =>
      runTest('Metrics Sync with Valid Authentication', async () => {
        const response = await retryRequest<SyncResponse>(
          'post',
          METRICS_ENDPOINTS.SYNC_METRICS,
          null,
          {
            Authorization: `Bearer ${accessToken}`,
          },
        );

        console.log(
          'POST /api/metrics/sync response:',
          JSON.stringify(response.data, null, 2),
        );

        expect(response.status).toBe(200);
        expect(response.data).not.toBeNull();
        expect(response.data.data).toHaveProperty(
          'message',
          'Metrics synced successfully',
        );
      }));

    it('should reject sync requests without authentication', () =>
      runTest('Reject Sync Unauthenticated', async () => {
        const response = await retryRequest<ErrorResponse>(
          'post',
          METRICS_ENDPOINTS.SYNC_METRICS,
        );

        console.log(
          'POST /api/metrics/sync without auth response:',
          JSON.stringify(response.data, null, 2),
        );

        expect(response.status).toBe(401);
        expect(response.data).toHaveProperty('error', 'No token provided');
        expect(response.data).toHaveProperty('statusCode', 401);
        expect(response.data.details).toHaveProperty(
          'errorCode',
          'ERR_UNAUTHORIZED',
        );
      }));

    it('should return updated data after sync', () =>
      runTest('Updated Data', async () => {
        // Trigger sync
        await retryRequest('post', METRICS_ENDPOINTS.SYNC_METRICS, null, {
          Authorization: `Bearer ${accessToken}`,
        });

        // Fetch metrics after sync
        const response = await retryRequest<MetricsResponse>(
          'get',
          METRICS_ENDPOINTS.GET_METRICS,
          null,
          {
            Authorization: `Bearer ${accessToken}`,
          },
        );

        expect(response.status).toBe(200);
        expect(response.data.data.metrics.length).toBeGreaterThan(0);
        // Add more specific checks based on expected data after sync
      }));
  });

  describe('POST /api/metrics/reset-database', () => {
    it('should reset the database with valid authentication', () =>
      runTest('Reset Database with Valid Authentication', async () => {
        // First, get the initial metrics count
        const initialResponse = await retryRequest<MetricsResponse>(
          'get',
          METRICS_ENDPOINTS.GET_METRICS,
          null,
          {
            Authorization: `Bearer ${accessToken}`,
          },
        );

        const initialMetricsCount = initialResponse.data.data.totalMetrics;

        // Trigger database reset
        const resetResponse = await retryRequest<ResetDatabaseResponse>(
          'post',
          METRICS_ENDPOINTS.RESET_DATABASE,
          null,
          {
            Authorization: `Bearer ${accessToken}`,
          },
        );

        console.log(
          'POST /api/metrics/reset-database response:',
          JSON.stringify(resetResponse.data, null, 2),
        );

        expect(resetResponse.status).toBe(200);
        expect(resetResponse.data).not.toBeNull();
        expect(resetResponse.data.data).toHaveProperty(
          'message',
          'Database reset successfully',
        );

        // Verify that the metrics have been reset
        const afterResetResponse = await retryRequest<MetricsResponse>(
          'get',
          METRICS_ENDPOINTS.GET_METRICS,
          null,
          {
            Authorization: `Bearer ${accessToken}`,
          },
        );

        const afterResetMetricsCount =
          afterResetResponse.data.data.totalMetrics;

        expect(afterResetMetricsCount).toBe(0);
        expect(afterResetMetricsCount).toBeLessThan(initialMetricsCount);
      }));

    it('should reject reset requests without authentication', () =>
      runTest('Reject Reset Unauthenticated', async () => {
        const response = await retryRequest<ErrorResponse>(
          'post',
          METRICS_ENDPOINTS.RESET_DATABASE,
        );

        console.log(
          'POST /api/metrics/reset-database without auth response:',
          JSON.stringify(response.data, null, 2),
        );

        expect(response.status).toBe(401);
        expect(response.data).toHaveProperty('error', 'No token provided');
        expect(response.data).toHaveProperty('statusCode', 401);
        expect(response.data.details).toHaveProperty(
          'errorCode',
          'ERR_UNAUTHORIZED',
        );
      }));

    it('should return empty data after reset', () =>
      runTest('Empty Data After Reset', async () => {
        // Trigger reset
        await retryRequest('post', METRICS_ENDPOINTS.RESET_DATABASE, null, {
          Authorization: `Bearer ${accessToken}`,
        });

        // Fetch metrics after reset
        const response = await retryRequest<MetricsResponse>(
          'get',
          METRICS_ENDPOINTS.GET_METRICS,
          null,
          {
            Authorization: `Bearer ${accessToken}`,
          },
        );

        expect(response.status).toBe(200);
        expect(response.data.data.metrics.length).toBe(0);
        expect(response.data.data.totalMetrics).toBe(0);
        expect(response.data.data.githubStats.totalPRs).toBe(0);
        expect(response.data.data.githubStats.fetchedPRs).toBe(0);
      }));
  });
});
