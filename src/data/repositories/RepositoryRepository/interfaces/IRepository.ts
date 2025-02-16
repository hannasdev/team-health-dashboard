import type { IRepositoryDetails } from './IRepositoryDetails.js';
import type { IRepositoryMetadata } from './IRepositoryMetadata.js';
import type { IRepositorySettings } from './IRepositorySettings.js';

// Main repository interfaceexport interface IRepository extends IRepositoryDetails {
export interface IRepository extends IRepositoryDetails {
  id: string;
  fullName: string;
  createdAt: Date;
  updatedAt: Date;
  lastSyncAt?: Date;
  settings: IRepositorySettings;
  metadata: IRepositoryMetadata;
}
