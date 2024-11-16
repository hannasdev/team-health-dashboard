// src/interfaces/ILoggedMessage.ts
export interface ILoggedMessage {
  level: string;
  message: string;
  meta?: {
    details?: Record<string, any>;
    requestInfo?: {
      headers?: Record<string, string>;
      method?: string;
      path?: string;
      ip?: string;
      userAgent?: string;
      userId?: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
}
