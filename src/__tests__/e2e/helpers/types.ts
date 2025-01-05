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
