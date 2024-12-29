import type {
  ISecurityLogger,
  ISecurityEvent,
  ISecurityRequest,
} from '../../interfaces/index.js';
import {
  SecurityEventType,
  SecurityEventSeverity,
} from '../../services/SecurityLogger/SecurityLogger.js';

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
    logSecurityEvent: jest.fn((event: ISecurityEvent): void => {}),

    getRequestInfo: jest.fn(
      (req: ISecurityRequest): ISecurityEvent['requestInfo'] => ({
        method: req.method,
        path: req.path,
        ip: req.ip || 'unknown',
        userAgent: req.get?.('user-agent'),
        userId: req.user?.id,
        headers: {},
      }),
    ),

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
          ip: req.ip || 'unknown',
          userAgent: req.get?.('user-agent'),
          userId: req.user?.id,
          headers: {},
        },
        details,
        severity,
      }),
    ),
  };
};
