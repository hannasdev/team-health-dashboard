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
    'user-agent'?: string;
    userId?: string;
    headers?: Record<string, string>;
  };
  details: Record<string, any>;
  severity: SecurityEventSeverity;
}
