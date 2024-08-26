// src/interfaces/ITeamHealthDashboardApp.ts

import { Express } from 'express';

export interface ITeamHealthDashboardApp {
  expressApp: Express;
  initialize(config: { skipDatabaseConnection?: boolean }): Promise<void>;
}
