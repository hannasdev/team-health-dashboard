import { createMockLogger } from '../../__mocks__/index.js';
import { createMockSecurityRequest } from './securityTestHelpers.js';
import {
  SecurityLogger,
  SecurityEventType,
  SecurityEventSeverity,
} from './SecurityLogger.js';

import type {
  ISecurityEvent,
  ISecurityRequest,
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
      const mockReq = createMockSecurityRequest();
      const requestInfo = securityLogger.getRequestInfo(mockReq);

      expect(requestInfo).toEqual({
        method: 'GET',
        path: '/test',
        ip: '127.0.0.1',
        userAgent: 'test-agent',
        userId: '123',
      });
    });

    it('should handle missing optional fields', () => {
      const mockReq = createMockSecurityRequest({
        get: jest.fn(() => undefined),
        user: undefined,
      });
      const requestInfo = securityLogger.getRequestInfo(mockReq);

      expect(requestInfo).toEqual({
        method: 'GET',
        path: '/test',
        ip: '127.0.0.1',
        userAgent: undefined,
        userId: undefined,
      });
    });
  });

  describe('sanitization', () => {
    it('should recursively sanitize nested sensitive data', () => {
      const mockReq = createMockSecurityRequest();
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

      expect(event.details.user.password).toBe('[REDACTED]');
      expect(event.details.user.apiToken).toBe('[REDACTED]');
      expect(event.details.user.profile.email).toBe('test@example.com');
      expect(event.details.user.profile.secretQuestion).toBe('[REDACTED]');
      expect(event.details.metadata.credentials).toBe('[REDACTED]');
    });

    it('should sanitize sensitive headers', () => {
      const mockReq = createMockSecurityRequest({
        get: jest.fn((name: string) => {
          const headers: Record<string, string> = {
            authorization: 'Bearer token123',
            cookie: 'session=abc123',
            'x-api-key': 'key123',
            'user-agent': 'test-browser',
          };
          return headers[name.toLowerCase()];
        }),
      });

      // Create the event directly to test header sanitization
      const event = securityLogger.createSecurityEvent(
        SecurityEventType.SUSPICIOUS_ACTIVITY,
        mockReq as ISecurityRequest,
        {
          headers: {
            authorization: 'Bearer token123',
            cookie: 'session=abc123',
            'x-api-key': 'key123',
            'user-agent': 'test-browser',
          },
        },
        SecurityEventSeverity.MEDIUM,
      );

      // Test that sensitive headers are redacted in the event details
      expect(event.details.headers.authorization).toBe('[REDACTED]');
      expect(event.details.headers.cookie).toBe('[REDACTED]');
      expect(event.details.headers['x-api-key']).toBe('[REDACTED]');
      expect(event.details.headers['user-agent']).toBe('test-browser');
    });
  });

  describe('createSecurityEvent', () => {
    it('should handle all SecurityEventTypes', () => {
      const mockReq = createMockSecurityRequest();
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
      const mockReq = createMockSecurityRequest();
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
