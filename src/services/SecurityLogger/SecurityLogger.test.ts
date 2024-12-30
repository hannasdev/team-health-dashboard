import { createMockRequest } from './securityTestHelpers.js';
import {
  SecurityLogger,
  SecurityEventType,
  SecurityEventSeverity,
} from './SecurityLogger.js';
import { createMockLogger } from '../../__mocks__/index.js';

import type { ISecurityEvent, ILogger } from '../../interfaces/index.js';

describe('SecurityLogger', () => {
  let securityLogger: SecurityLogger;
  let mockLogger: jest.Mocked<ILogger>;

  beforeEach(() => {
    mockLogger = createMockLogger();
    securityLogger = new SecurityLogger(mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('logSecurityEvent', () => {
    const createTestEvent = (
      severity: SecurityEventSeverity,
    ): ISecurityEvent => ({
      eventType: SecurityEventType.SUSPICIOUS_ACTIVITY,
      timestamp: new Date(),
      requestInfo: {
        method: 'GET',
        path: '/test',
        ip: '127.0.0.1',
      },
      details: { test: 'data' },
      severity,
    });

    it('should log critical events as errors and trigger alert', () => {
      const event = createTestEvent(SecurityEventSeverity.CRITICAL);
      securityLogger.logSecurityEvent(event);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Security Event: SUSPICIOUS_ACTIVITY - CRITICAL',
        undefined,
        expect.any(Object),
      );
      // Verify alert was triggered
      expect(mockLogger.error).toHaveBeenCalledWith(
        'SECURITY ALERT',
        undefined,
        expect.objectContaining({
          event,
          alert: true,
          timestamp: expect.any(String),
        }),
      );
    });

    it('should log high severity events as errors', () => {
      const event = createTestEvent(SecurityEventSeverity.HIGH);
      securityLogger.logSecurityEvent(event);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Security Event: SUSPICIOUS_ACTIVITY - HIGH',
        undefined,
        expect.any(Object),
      );
    });

    it('should log medium severity events as warnings', () => {
      const event = createTestEvent(SecurityEventSeverity.MEDIUM);
      securityLogger.logSecurityEvent(event);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Security Event: SUSPICIOUS_ACTIVITY - MEDIUM',
        expect.any(Object),
      );
    });

    it('should log low severity events as info', () => {
      const event = createTestEvent(SecurityEventSeverity.LOW);
      securityLogger.logSecurityEvent(event);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Security Event: SUSPICIOUS_ACTIVITY - LOW',
        expect.any(Object),
      );
    });
  });

  describe('getRequestInfo', () => {
    it('should extract basic request information', () => {
      const mockReq = createMockRequest();
      const requestInfo = securityLogger.getRequestInfo(mockReq);

      expect(requestInfo).toEqual({
        method: 'GET',
        path: '/test',
        ip: '127.0.0.1',
        'user-agent': 'test-agent',
        userId: '123',
      });
    });

    it('should handle missing optional fields', () => {
      const mockReq = createMockRequest({
        'user-agent': undefined,
        user: undefined,
      });
      const requestInfo = securityLogger.getRequestInfo(mockReq);

      expect(requestInfo).toEqual({
        method: 'GET',
        path: '/test',
        ip: '127.0.0.1',
        'user-agent': undefined,
        userId: undefined,
      });
    });
  });

  describe('sanitization', () => {
    it('should recursively sanitize nested sensitive data', () => {
      const mockReq = createMockRequest();
      const details = {
        user: {
          password: 'secret',
          apiToken: 'token123',
          profile: {
            email: 'test@example.com',
            secretQuestion: 'secret answer',
          },
        },
        metadata: {
          credentials: 'sensitive-data',
        },
      };

      const event = securityLogger.createSecurityEvent(
        SecurityEventType.AUTH_FAILURE,
        mockReq,
        details,
        SecurityEventSeverity.HIGH,
      );

      expect(event.details).toMatchObject({
        user: {
          password: '[REDACTED]',
          apiToken: '[REDACTED]',
          profile: {
            email: 'test@example.com',
            secretQuestion: '[REDACTED]',
          },
        },
        metadata: {
          credentials: '[REDACTED]',
        },
      });
    });

    it('should sanitize sensitive headers', () => {
      const mockReq = createMockRequest({
        authorization: 'Bearer token123',
        cookie: 'session=abc123',
        'x-api-key': 'key123',
        'user-agent': 'test-browser',
      });

      const event = securityLogger.createSecurityEvent(
        SecurityEventType.SUSPICIOUS_ACTIVITY,
        mockReq,
        {
          authorization: 'Bearer token123',
          cookie: 'session=abc123',
          'x-api-key': 'key123',
          'user-agent': 'test-browser',
        },
        SecurityEventSeverity.MEDIUM,
      );

      expect(event.details).toMatchObject({
        authorization: '[REDACTED]',
        cookie: '[REDACTED]',
        'x-api-key': '[REDACTED]',
        'user-agent': 'test-browser',
      });
    });
  });

  describe('createSecurityEvent', () => {
    it('should handle all SecurityEventTypes', () => {
      const mockReq = createMockRequest();
      const details = { reason: 'test' };

      Object.values(SecurityEventType).forEach(eventType => {
        const event = securityLogger.createSecurityEvent(
          eventType,
          mockReq,
          details,
          SecurityEventSeverity.MEDIUM,
        );

        expect(event).toMatchObject({
          eventType,
          severity: SecurityEventSeverity.MEDIUM,
          requestInfo: expect.any(Object),
          details: expect.any(Object),
          timestamp: expect.any(Date),
        });
      });
    });

    it('should preserve non-sensitive data in details', () => {
      const mockReq = createMockRequest();
      const details = {
        public: 'safe-data',
        metrics: {
          attempts: 3,
          timestamp: new Date().toISOString(),
        },
        password: 'secret',
      };

      const event = securityLogger.createSecurityEvent(
        SecurityEventType.AUTH_FAILURE,
        mockReq,
        details,
        SecurityEventSeverity.HIGH,
      );

      expect(event.details).toMatchObject({
        public: 'safe-data',
        metrics: {
          attempts: 3,
          timestamp: expect.any(String),
        },
        password: '[REDACTED]',
      });
    });
  });
});
