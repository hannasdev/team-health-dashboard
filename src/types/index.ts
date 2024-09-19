// src/types/index.ts

import { Model } from 'mongoose';

import { IGoogleSheetsMetric, IGitHubPullRequest } from '../interfaces';

export type ProgressCallback = (
  current: number,
  total: number,
  message: string,
) => void;

export enum EventType {
  PROGRESS = 'progress',
  RESULT = 'result',
  ERROR = 'error',
  HEARTBEAT = 'heartbeat',
  TOKEN_REFRESHED = 'tokenRefreshed',
}

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

export type GoogleSheetsMetricModel = Model<IGoogleSheetsMetric>;
export type GitHubPullRequestModel = Model<IGitHubPullRequest>;
