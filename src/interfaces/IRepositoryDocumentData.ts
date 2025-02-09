import { Types } from 'mongoose';

import {
  RepositoryStatus,
  IRepositorySettings,
  IRepositoryMetadata,
} from './IRepository';

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
