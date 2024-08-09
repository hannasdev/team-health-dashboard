//src/app.ts
import 'reflect-metadata';
import cors from 'cors';
import express, { Express, Request, Response } from 'express';

import { Config } from '@/config/config';
import '@/container';
import authRouter from '@/routes/auth';
import healthCheckRouter from '@/routes/healthCheck';
import metricsRouter from '@/routes/metrics';

export class App {
  public app: Express;
  private config: Config;

  constructor() {
    this.app = express();
    this.config = Config.getInstance();
    this.configureCors();
    this.configureRoutes();
  }

  private configureCors(): void {
    this.app.use(
      cors({
        origin: (origin, callback) => {
          const allowedOrigins = this.config.CORS_ORIGIN.split(',');
          if (
            !origin ||
            allowedOrigins.indexOf(origin) !== -1 ||
            allowedOrigins.includes('*')
          ) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      }),
    );
  }

  private configureRoutes(): void {
    this.app.get('/', (req: Request, res: Response) => {
      res.send('Team Health Dashboard API');
    });

    this.app.use('/health', healthCheckRouter);
    this.app.use('/api', metricsRouter);
    this.app.use('/api/auth', authRouter);
  }
}

export default new App().app;
