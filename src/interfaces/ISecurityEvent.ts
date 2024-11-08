import {
  SecurityEventType,
  SecurityEventSeverity,
} from '../services/SecurityLogger/SecurityLogger.js';

export interface ISecurityEvent {
  eventType: SecurityEventType;
  timestamp: Date;
  requestInfo: {
    method: string;
    path: string;
    ip: string;
    userAgent?: string;
    userId?: string;
    headers?: Record<string, string>;
  };
  details: Record<string, any>;
  severity: SecurityEventSeverity;
}
