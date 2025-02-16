import { Types } from 'mongoose';

import { RepositoryStatus } from '../../../types/index.js';

import type {
  IRepositorySettings,
  IRepositoryMetadata,
} from '../../repositories/RepositoryRepository/interfaces/index.js';

export interface IRepositoryDocumentData {
  _id: Types.ObjectId | string;
  name: string;
  owner: string;
  fullName: string;
  credentials: {
    type: 'token' | 'oauth';
    value: string;
    lastValidated?: Date;
  };
  status: RepositoryStatus;
  createdAt: Date;
  updatedAt: Date;
  lastSyncAt?: Date;
  settings: IRepositorySettings;
  metadata: IRepositoryMetadata;
}
