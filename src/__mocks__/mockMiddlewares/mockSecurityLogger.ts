import {
  SecurityEventType,
  SecurityEventSeverity,
} from '../../services/SecurityLogger/SecurityLogger.js';

import type {
  ISecurityLogger,
  ISecurityEvent,
  ISecurityRequest,
  ILoggedMessage,
} from '../../interfaces/index.js';

export const createMockSecurityLogger = (): jest.Mocked<ISecurityLogger> => {
  const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'credential'];
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];

  const sanitizeObject = (obj: Record<string, any>): Record<string, any> => {
    const sanitized = { ...obj };

    Object.keys(sanitized).forEach(key => {
      if (
        sensitiveKeys.some(sensitive =>
          key.toLowerCase().includes(sensitive.toLowerCase()),
        )
      ) {
        sanitized[key] = '[REDACTED]';
      } else if (
        typeof sanitized[key] === 'object' &&
        sanitized[key] !== null
      ) {
        sanitized[key] = sanitizeObject(sanitized[key]);
      }
    });

    return sanitized;
  };

  const sanitizeRequestInfo = (
    requestInfo: Record<string, any>,
  ): Record<string, any> => {
    const sanitized = { ...requestInfo };

    if (sanitized.headers) {
      const sanitizedHeaders = { ...sanitized.headers };
      sensitiveHeaders.forEach(header => {
        if (sanitizedHeaders[header]) {
          sanitizedHeaders[header] = '[REDACTED]';
        }
      });
      sanitized.headers = sanitizedHeaders;
    }

    return sanitized;
  };

  return {
    logSecurityEvent: jest.fn((event: ISecurityEvent): void => {
      const sanitizedEvent = {
        ...event,
        details: sanitizeObject(event.details),
        requestInfo: sanitizeRequestInfo(event.requestInfo),
      };
      // Mock implementation of logging if needed
    }),

    getRequestInfo: jest.fn((req: ISecurityRequest) => ({
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.user?.id,
    })),

    createSecurityEvent: jest.fn(
      (
        type: SecurityEventType,
        req: ISecurityRequest,
        details: Record<string, any>,
        severity: SecurityEventSeverity,
      ): ISecurityEvent => ({
        eventType: type,
        timestamp: new Date(),
        requestInfo: {
          method: req.method,
          path: req.path,
          ip: req.ip,
          userAgent: req.get('user-agent'),
          userId: req.user?.id,
        },
        details: sanitizeObject(details),
        severity,
      }),
    ),
  };
};
