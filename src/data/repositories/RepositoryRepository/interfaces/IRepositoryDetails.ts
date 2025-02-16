import { RepositoryStatus } from '../../../../types/index.js';

import type { IRepositoryMetadata } from './IRepositoryMetadata.js';
import type { IRepositorySettings } from './IRepositorySettings.js';

export interface IRepositoryCredentials {
  type: 'token' | 'oauth';
  value: string;
  lastValidated?: Date;
}

export interface IRepositoryDetails {
  owner: string;
  name: string;
  credentials: IRepositoryCredentials;
  settings?: Partial<IRepositorySettings>;
  metadata?: Partial<IRepositoryMetadata>;
  status?: RepositoryStatus;
}
