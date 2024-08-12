// src/interfaces/ITeamHealthDashboardApp.ts

import { Express } from 'express';

export interface ITeamHealthDashboardApp {
  expressApp: Express;
  initialize(): Promise<void>;
}
