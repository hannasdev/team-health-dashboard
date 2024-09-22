// src/__tests__/e2e/helpers/apiHelpers.ts
import axios, { AxiosResponse, Method } from 'axios';

import { AUTH_ENDPOINTS } from './constants.js';

export const apiEndpoint = 'http://app-test:3000';

export const axiosInstance = axios.create({
  baseURL: apiEndpoint,
  validateStatus: () => true,
});

export const wait = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

export const retryRequest = async <T = any>(
  method: Method,
  url: string,
  data: any = null,
  headers: Record<string, string> = {},
): Promise<AxiosResponse<T>> => {
  const maxRetries = 3;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response: AxiosResponse<T> = await axios({
        method,
        url: `http://app-test:3000${url}`,
        data,
        headers,
        validateStatus: () => true,
      });
      return response;
    } catch (error) {
      console.error(`Request failed (attempt ${i + 1}/${maxRetries}):`, error);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      if (axios.isAxiosError(error) && error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      }
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error('Max retries reached');
};

export const createTestUser = async () => {
  const email = `testuser_${Date.now()}@example.com`;
  const password = 'testpassword';
  const registerResponse = await retryRequest('post', AUTH_ENDPOINTS.REGISTER, {
    email,
    password,
  });
  // console.log('registered user', registerResponse);
  return {
    id: registerResponse.data.data.user.id,
    email,
    password,
  };
};

export const loginUser = async (
  email: string,
  password: string,
  shortLived: boolean = false,
) => {
  const loginResponse = await retryRequest('post', AUTH_ENDPOINTS.LOGIN, {
    email,
    password,
    shortLived,
  });
  // console.log('loginUser:', loginResponse.data);
  const userAccessToken = loginResponse.data.data.accessToken;
  const userRefreshToken = loginResponse.data.data.refreshToken;

  return {
    userAccessToken,
    userRefreshToken,
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
  const response = await retryRequest('post', AUTH_ENDPOINTS.LOGIN, {
    email,
    password,
    shortLived: true,
  });
  console.log('Short-lived token response:', response.data);
  return response.data.data.accessToken;
};

export const refreshAccessToken = async (
  refreshToken: string,
): Promise<string> => {
  try {
    const response = await axiosInstance.post(AUTH_ENDPOINTS.REFRESH, {
      refreshToken,
    });

    if (response.data && response.data.data && response.data.data.accessToken) {
      return response.data.data.accessToken;
    } else {
      throw new Error('Failed to refresh token: Invalid response structure');
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw new Error('Failed to refresh token');
  }
};
