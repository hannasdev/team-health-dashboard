// src/interfaces/IApplication.ts
import { Express } from 'express';

export interface IApplication {
  expressApp: Express;
  initialize(): Promise<void>;
}
