//src/app.ts
import 'reflect-metadata';
import cors from 'cors';
import express, { Express, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import authRouter from '@/routes/auth';
import healthCheckRouter from '@/routes/healthCheck';
import metricsRouter from '@/routes/metrics';
import { IMongoDbClient } from '@/services/database/MongoDbClient';
import { ILogger, IConfig } from '@/interfaces';
import { TYPES } from '@/utils/types';

@injectable()
export class TeamHealthDashboardApp {
  public expressApp: Express;

  constructor(
    @inject(TYPES.Config) private config: IConfig,
    @inject(TYPES.MongoDbClient) private mongoDbClient: IMongoDbClient,
    @inject(TYPES.Logger) private logger: ILogger,
  ) {
    this.expressApp = express();
    this.configureCors();
    this.configureRoutes();
  }

  public async initialize(): Promise<void> {
    try {
      await this.mongoDbClient.connect();
      this.logger.info('Database connection established');
    } catch (error) {
      this.logger.error('Failed to connect to the database', error as Error);
      throw error;
    }
  }

  private configureCors(): void {
    this.expressApp.use(
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
    this.expressApp.get('/', (req: Request, res: Response) => {
      res.send('Team Health Dashboard API');
    });

    this.expressApp.use('/health', healthCheckRouter);
    this.expressApp.use('/api', metricsRouter);
    this.expressApp.use('/api/auth', authRouter);
  }
}
