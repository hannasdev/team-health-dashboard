// src/__tests__/e2e/helpers/apiHelpers.ts
import axios, { AxiosResponse, Method } from 'axios';

import { config } from './config.js';
import { AUTH_ENDPOINTS, METRICS_ENDPOINTS } from './constants.js';

import type { AuthResponse, MetricsResponse } from './types.js';

export const axiosInstance = axios.create({
  baseURL: config.apiEndpoint,
  validateStatus: () => true,
  timeout: 5000,
  timeoutErrorMessage: 'Request timed out',
});

export const wait = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

export const retryRequest = async <T = any>(
  method: Method,
  url: string,
  data: any = null,
  headers: Record<string, string> = {},
): Promise<AxiosResponse<T>> => {
  for (let i = 0; i < config.maxRetries; i++) {
    try {
      const response: AxiosResponse<T> = await axios({
        method,
        url: `http://app-test:3000${url}`,
        data,
        headers,
        validateStatus: () => true,
      });
      // console.log('RESPONSE:', response.data);
      // If we get a rate limit error, wait and retry
      if (response.status === 429) {
        const delay = config.retryDelay * Math.pow(2, i); // Exponential backoff
        console.log(
          `Rate limited. Waiting ${delay}ms before retry ${i + 1}/${config.maxRetries}`,
        );
        await wait(delay);
        continue;
      }

      return response;
    } catch (error) {
      console.error(
        `Request failed (attempt ${i + 1}/${config.maxRetries}):`,
        error,
      );
      if (axios.isAxiosError(error) && error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }

      if (i === config.maxRetries - 1) throw error;

      const delay = config.retryDelay * Math.pow(2, i);
      await wait(delay);
    }
  }
  throw new Error('Max retries reached');
};

export const createTestUser = async () => {
  const email = `testuser_${Date.now()}@example.com`;

  console.log(`Creating test user with email: ${email}`);

  const registerResponse = await retryRequest<AuthResponse>(
    'post',
    AUTH_ENDPOINTS.REGISTER,
    {
      email,
      password: config.defaultPassword,
    },
  );

  console.log('Register response:', registerResponse.data.success);

  if (registerResponse.status === 429) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }

  if (
    !registerResponse.data?.success ||
    !registerResponse.data?.data?.user?._id
  ) {
    console.error(
      'Unexpected register response:',
      registerResponse.data.success,
    );
    throw new Error(
      `Failed to create test user: ${registerResponse.data?.error || 'Invalid response structure'}`,
    );
  }

  return {
    id: registerResponse.data.data.user._id,
    email,
    password: config.defaultPassword,
  };
};

export const loginUser = async (
  email: string,
  password: string,
  shortLived: boolean = false,
) => {
  console.log(`Attempting to login user: ${email}`);

  const loginResponse = await retryRequest<AuthResponse>(
    'post',
    AUTH_ENDPOINTS.LOGIN,
    {
      email,
      password,
      shortLived,
    },
  );

  console.log('Login response:', loginResponse.data.success);

  if (loginResponse.status === 429) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }

  if (
    !loginResponse.data?.success ||
    !loginResponse.data?.data?.accessToken ||
    !loginResponse.data?.data?.refreshToken
  ) {
    throw new Error(
      `Failed to login: ${loginResponse.data?.error || 'Invalid response structure'}`,
    );
  }

  return {
    userAccessToken: loginResponse.data.data.accessToken,
    userRefreshToken: loginResponse.data.data.refreshToken,
  };
};

export function expectSetCookieHeader(
  response: AxiosResponse,
  pattern: RegExp,
) {
  const setCookieHeader = response.headers['set-cookie'];
  expect(setCookieHeader).toBeDefined();
  expect(Array.isArray(setCookieHeader)).toBe(true);

  if (Array.isArray(setCookieHeader) && setCookieHeader.length > 0) {
    expect(setCookieHeader[0]).toMatch(pattern);
  } else {
    throw new Error(
      `Expected set-cookie header matching ${pattern}, but it was not found`,
    );
  }
}

export const getShortLivedToken = async (
  email: string,
  password: string,
): Promise<string> => {
  const response = await retryRequest<AuthResponse>(
    'post',
    AUTH_ENDPOINTS.LOGIN,
    {
      email,
      password,
      shortLived: true,
    },
  );

  console.log('Short-lived token response status:', response.status);

  if (!response.data?.data?.accessToken) {
    console.error('Unexpected short-lived token response:', response.data);
    throw new Error(
      'Failed to get short-lived token: Invalid response structure',
    );
  }

  return response.data.data.accessToken;
};

export const refreshAccessToken = async (
  refreshToken: string,
): Promise<string> => {
  try {
    console.log('Attempting to refresh access token');

    const response = await axiosInstance.post<AuthResponse>(
      AUTH_ENDPOINTS.REFRESH,
      {
        refreshToken,
      },
    );

    console.log('Refresh token response status:', response.status);

    if (!response.data?.data?.accessToken) {
      console.error('Unexpected refresh token response:', response.data);
      throw new Error('Failed to refresh token: Invalid response structure');
    }

    return response.data.data.accessToken;
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw new Error('Failed to refresh token');
  }
};

export const ensureMetricsExist = async (
  accessToken: string,
): Promise<void> => {
  console.log('Ensuring metrics exist...');

  // First check if metrics already exist
  const checkResponse = await retryRequest<MetricsResponse>(
    'get',
    METRICS_ENDPOINTS.GET_METRICS,
    null,
    { Authorization: `Bearer ${accessToken}` },
  );

  if (checkResponse.data?.data?.totalMetrics === 0) {
    console.log('No metrics found, triggering sync...');
    // If no metrics exist, trigger a sync
    await retryRequest('post', METRICS_ENDPOINTS.SYNC_METRICS, null, {
      Authorization: `Bearer ${accessToken}`,
    });

    // Wait a bit for sync to complete
    await wait(2000);

    // Verify metrics were created
    const verifyResponse = await retryRequest<MetricsResponse>(
      'get',
      METRICS_ENDPOINTS.GET_METRICS,
      null,
      { Authorization: `Bearer ${accessToken}` },
    );

    if (verifyResponse.data?.data?.totalMetrics === 0) {
      throw new Error('Failed to create metrics after sync');
    }
  }

  console.log('Metrics existence verified');
};
