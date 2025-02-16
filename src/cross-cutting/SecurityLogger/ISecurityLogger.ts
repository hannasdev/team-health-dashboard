import type {
  ISecurityEvent,
  ISecurityRequest,
} from '../../presentation/middleware/RateLimitMiddleware/interfaces/index';
import type {
  SecurityEventType,
  SecurityEventSeverity,
} from '../../types/index';

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
