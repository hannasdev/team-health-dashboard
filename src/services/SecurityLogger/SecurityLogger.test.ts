// src/services/SecurityLogger/SecurityLogger.test.ts
import { createMockSecurityLogger } from '../../__mocks__/index.js';
import { createMockSecurityRequest } from './securityTestHelpers.js';
import {
  SecurityLogger,
  SecurityEventType,
  SecurityEventSeverity,
} from './SecurityLogger.js';
import type {
  ISecurityEvent,
  ISecurityRequest,
} from '../../interfaces/index.js';

describe('SecurityLogger', () => {
  const mockSecurityLogger = createMockSecurityLogger();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('logSecurityEvent', () => {
    it('should log critical events as errors', () => {
      const event: ISecurityEvent = {
        eventType: SecurityEventType.CSP_VIOLATION,
        timestamp: new Date(),
        requestInfo: {
          method: 'GET',
          path: '/test',
          ip: '127.0.0.1',
        },
        details: { test: 'data' },
        severity: SecurityEventSeverity.CRITICAL,
      };

      mockSecurityLogger.logSecurityEvent(event);

      expect(mockSecurityLogger.logSecurityEvent).toHaveBeenCalledWith(event);
    });

    it('should sanitize sensitive information', () => {
      // Create a mock request with sensitive data
      const mockRequest = createMockSecurityRequest({
        method: 'POST',
        path: '/api/auth',
        ip: '127.0.0.1',
        get: jest.fn(name => {
          if (name === 'authorization') return 'Bearer token123';
          return undefined;
        }),
        user: { id: '123' },
      });

      const details = {
        password: 'secret123',
        apiKey: 'key123',
        otherData: 'safe',
      };

      // When the event is created
      const createdEvent = mockSecurityLogger.createSecurityEvent(
        SecurityEventType.SUSPICIOUS_ACTIVITY,
        mockRequest,
        details,
        SecurityEventSeverity.HIGH,
      );

      // Then the sensitive data should be sanitized
      expect(createdEvent.details.password).toBe('[REDACTED]');
      expect(createdEvent.details.apiKey).toBe('[REDACTED]');
      expect(createdEvent.details.otherData).toBe('safe');
    });
  });

  describe('createSecurityEvent', () => {
    it('should create a properly formatted security event', () => {
      const mockReq = createMockSecurityRequest();
      const details = { reason: 'test' };

      const event = mockSecurityLogger.createSecurityEvent(
        SecurityEventType.SUSPICIOUS_ACTIVITY,
        mockReq,
        details,
        SecurityEventSeverity.MEDIUM,
      );

      expect(event).toMatchObject({
        eventType: SecurityEventType.SUSPICIOUS_ACTIVITY,
        severity: SecurityEventSeverity.MEDIUM,
        requestInfo: {
          method: 'GET',
          path: '/test',
          ip: '127.0.0.1',
          userAgent: 'test-agent',
          userId: '123',
        },
        details: { reason: 'test' },
      });
      expect(event.timestamp).toBeInstanceOf(Date);
    });
  });
});
