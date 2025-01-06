export interface AuthResponse {
  success: boolean;
  data?: {
    user?: {
      _id: string;
      email: string;
      __v?: number;
    };
    accessToken?: string;
    refreshToken?: string;
  };
  error?: string;
  details?: { errorCode: string };
  statusCode?: number;
}

export interface MetricsResponse {
  data: {
    metrics: Array<{
      _id: string;
      metric_category: string;
      metric_name: string;
      value: number;
      timestamp: string;
      unit: string;
      source: string;
    }>;
    githubStats: {
      totalPRs: number;
      fetchedPRs: number;
      timePeriod: number;
    };
    totalMetrics: number;
  };
  success: boolean;
}
