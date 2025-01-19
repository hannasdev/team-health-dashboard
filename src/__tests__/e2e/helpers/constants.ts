// src/__tests__/e2e/helpers/constants.ts
export const DEFAULT_TIMEOUT = 300000; // 5 minutes
export const DEFAULT_TIME_PERIOD = 90;
export const METRICS_ENDPOINTS = {
  GET_METRICS: '/api/metrics',
  SYNC_METRICS: '/api/metrics/sync',
  RESET_DATABASE: '/api/metrics/reset-database',
};

export const AUTH_ENDPOINTS = {
  REGISTER: '/api/auth/register',
  LOGIN: '/api/auth/login',
  REFRESH: '/api/auth/refresh',
  LOGOUT: '/api/auth/logout',
};

export const REPOSITORY_ENDPOINTS = {
  LIST_REPOSITORIES: '/api/repositories',
  GET_REPOSITORY: (id: string) => `/api/repositories/${id}`,
  CREATE_REPOSITORY: '/api/repositories',
  UPDATE_REPOSITORY: '/api/repositories/:repositoryId',
  DELETE_REPOSITORY: (id: string) => `/api/repositories/${id}`,
  UPDATE_STATUS: (id: string) => `/api/repositories/${id}/status`,
};
