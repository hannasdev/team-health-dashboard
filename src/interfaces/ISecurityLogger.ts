import type { ISecurityEvent } from './ISecurityEvent';
import type { ISecurityRequest } from './ISecurityRequest';
import type {
  SecurityEventType,
  SecurityEventSeverity,
} from '../services/SecurityLogger/SecurityLogger';

export interface ISecurityLogger {
  logSecurityEvent(event: ISecurityEvent): void;
  getRequestInfo(req: ISecurityRequest): ISecurityEvent['requestInfo'];
  createSecurityEvent(
    type: SecurityEventType,
    req: ISecurityRequest,
    details: Record<string, any>,
    severity: SecurityEventSeverity,
  ): ISecurityEvent;
}
