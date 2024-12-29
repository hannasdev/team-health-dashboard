import { createMockLogger } from '../../__mocks__/index.js';
import { createMockRequest } from './securityTestHelpers.js';
import {
  SecurityLogger,
  SecurityEventType,
  SecurityEventSeverity,
} from './SecurityLogger.js';

import type {
  ISecurityEvent,
  IEnhancedRequest,
  ILogger,
} from '../../interfaces/index.js';

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
        userAgent: 'test-agent',
        userId: '123',
        headers: expect.any(Object),
      });
    });

    it('should handle missing optional fields', () => {
      const mockReq = createMockRequest({
        headers: {}, // Empty headers
        get: (name: string) => undefined, // Explicitly override get to return undefined
        user: undefined,
      });
      const requestInfo = securityLogger.getRequestInfo(mockReq);

      expect(requestInfo).toEqual({
        method: 'GET',
        path: '/test',
        ip: '127.0.0.1',
        userAgent: undefined,
        userId: undefined,
        headers: expect.any(Object),
      });
    });

    it('should use socket.remoteAddress as fallback for IP', () => {
      const mockReq = createMockRequest({
        ip: undefined,
      });
      const requestInfo = securityLogger.getRequestInfo(mockReq);

      expect(requestInfo.ip).toBe('127.0.0.1');
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
        headers: {
          authorization: 'Bearer token123',
          cookie: 'session=abc123',
          'x-api-key': 'key123',
          'user-agent': 'test-browser',
        },
      });

      const event = securityLogger.createSecurityEvent(
        SecurityEventType.SUSPICIOUS_ACTIVITY,
        mockReq,
        { headers: mockReq.headers },
        SecurityEventSeverity.MEDIUM,
      );

      expect(event.details.headers).toMatchObject({
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
