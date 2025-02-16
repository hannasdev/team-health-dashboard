// src/types/index.ts
export type ProgressCallback = (
  current: number,
  total: number,
  message: string,
) => void;

export enum HeaderKeys {
  AUTHORIZATION = 'Authorization',
  CONTENT_TYPE = 'Content-Type',
  ACCEPT = 'Accept',
  REFRESH_TOKEN = 'Refresh-Token',
  X_TOKEN_EXPIRING = 'X-Token-Expiring',
  X_TOKEN_REFRESHED = 'X-Token-Refreshed',
  CACHE_CONTROL = 'Cache-Control',
  CONNECTION = 'Connection',
}

export enum HeaderValues {
  BEARER = 'Bearer',
  APPLICATION_JSON = 'application/json',
  TEXT_EVENT_STREAM = 'text/event-stream',
  NO_CACHE = 'no-cache',
  KEEP_ALIVE = 'keep-alive',
}

// Enum for repository status to ensure type safety
export enum RepositoryStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
  VALIDATION_PENDING = 'validation_pending',
  VALIDATION_FAILED = 'validation_failed',
}

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
