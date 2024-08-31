// src/__tests__/e2e/helpers/apiHelpers.ts
import axios, { AxiosResponse } from 'axios';

export const apiEndpoint = 'http://app-test:3000';

export const axiosInstance = axios.create({
  baseURL: apiEndpoint,
  validateStatus: () => true,
});

export const wait = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

export const retryRequest = async (
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

export const createTestUser = async () => {
  const email = `testuser_${Date.now()}@example.com`;
  const password = 'testpassword';
  const registerResponse = await retryRequest('post', '/api/auth/register', {
    email,
    password,
  });
  return {
    id: registerResponse.data.user.id,
    email,
    password,
  };
};

export const loginUser = async (email: string, password: string) => {
  const loginResponse = await retryRequest('post', '/api/auth/login', {
    email,
    password,
  });
  return {
    userAccessToken: loginResponse.data.accessToken,
    userRefreshToken: loginResponse.data.refreshToken,
  };
};
