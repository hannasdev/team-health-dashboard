import { inject, injectable } from 'inversify';

import { TYPES } from '../../utils/types.js';

import type {
  ILogger,
  ISecurityEvent,
  ISecurityLogger,
  ISecurityRequest,
} from '../../interfaces/index.js';

export enum SecurityEventType {
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  BLOCKED_REQUEST = 'BLOCKED_REQUEST',
  CSP_VIOLATION = 'CSP_VIOLATION',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  AUTH_FAILURE = 'AUTH_FAILURE',
  SECURITY_HEADER_FAILURE = 'SECURITY_HEADER_FAILURE',
}

export enum SecurityEventSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

@injectable()
export class SecurityLogger implements ISecurityLogger {
  private static readonly SENSITIVE_HEADERS = [
    'authorization',
    'cookie',
    'x-api-key',
  ];

  constructor(@inject(TYPES.Logger) private logger: ILogger) {}

  public logSecurityEvent(event: ISecurityEvent): void {
    const logMessage = this.formatSecurityEvent(event);

    switch (event.severity) {
      case SecurityEventSeverity.CRITICAL:
        this.logger.error(logMessage.message, undefined, logMessage.meta);
        break;
      case SecurityEventSeverity.HIGH:
        this.logger.error(logMessage.message, undefined, logMessage.meta);
        break;
      case SecurityEventSeverity.MEDIUM:
        this.logger.warn(logMessage.message, logMessage.meta);
        break;
      case SecurityEventSeverity.LOW:
        this.logger.info(logMessage.message, logMessage.meta);
        break;
    }

    // Optionally trigger alerts for high-severity events
    if (event.severity === SecurityEventSeverity.CRITICAL) {
      this.triggerSecurityAlert(event);
    }
  }

  public getRequestInfo(req: ISecurityRequest): ISecurityEvent['requestInfo'] {
    return {
      method: req.method,
      path: req.path,
      ip: req.ip,
      'user-agent': req['user-agent'],
      userId: req.user?.id,
    };
  }

  public createSecurityEvent(
    type: SecurityEventType,
    req: ISecurityRequest,
    details: Record<string, any>,
    severity: SecurityEventSeverity,
  ): ISecurityEvent {
    return {
      eventType: type,
      timestamp: new Date(),
      requestInfo: this.getRequestInfo(req),
      details: this.sanitizeEventDetails(details),
      severity,
    };
  }

  private formatSecurityEvent(event: ISecurityEvent): {
    message: string;
    meta: Record<string, any>;
  } {
    const { eventType, timestamp, requestInfo, details, severity } = event;

    return {
      message: `Security Event: ${eventType} - ${severity}`,
      meta: {
        timestamp: timestamp.toISOString(),
        requestInfo: this.sanitizeRequestInfo(requestInfo),
        details: this.sanitizeEventDetails(details),
        severity,
      },
    };
  }

  private sanitizeRequestInfo(
    requestInfo: ISecurityEvent['requestInfo'],
  ): ISecurityEvent['requestInfo'] {
    // Create a copy to avoid modifying the original
    const sanitized = { ...requestInfo };

    // Create a headers object if it doesn't exist
    if (!('headers' in sanitized)) {
      sanitized.headers = {};
    }

    // Remove sensitive headers if they were included
    if (sanitized.headers) {
      const sanitizedHeaders = { ...sanitized.headers };
      SecurityLogger.SENSITIVE_HEADERS.forEach(header => {
        const headerKey = header.toLowerCase();
        if (sanitizedHeaders[headerKey]) {
          sanitizedHeaders[headerKey] = '[REDACTED]';
        }
      });
      sanitized.headers = sanitizedHeaders;
    }

    return sanitized;
  }

  private sanitizeEventDetails(
    details: Record<string, any>,
  ): Record<string, any> {
    const sensitiveKeys = [
      /password/i,
      /token/i,
      /api[-_]?key/i,
      /secret/i,
      /credential/i,
      /authorization/i,
      /cookie/i,
    ];

    const sanitizeValue = (value: any): any => {
      if (value === null || value === undefined) {
        return value;
      }

      if (typeof value === 'object') {
        return Object.fromEntries(
          Object.entries(value).map(([key, val]) => [
            key,
            sensitiveKeys.some(pattern => pattern.test(key))
              ? '[REDACTED]'
              : sanitizeValue(val),
          ]),
        );
      }

      return value;
    };

    return sanitizeValue(details);
  }

  private async triggerSecurityAlert(event: ISecurityEvent): Promise<void> {
    // This could be implemented to send alerts via email, Slack, etc.
    this.logger.error('SECURITY ALERT', undefined, {
      event,
      alert: true,
      timestamp: new Date().toISOString(),
    });
  }
}
