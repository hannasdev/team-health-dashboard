// src/app.ts

import 'reflect-metadata';
import cors from 'cors';
import express, { Express, Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import { inject, injectable } from 'inversify';
import authRouter from './routes/auth.js';
import healthCheckRouter from './routes/healthCheck.js';
import metricsRouter from './routes/metrics.js';
import { IMongoDbClient } from './services/database/MongoDbClient.js';
import { ILogger, IConfig } from './interfaces/index.js';
import { TYPES } from './utils/types.js';
import { ITeamHealthDashboardApp } from './interfaces/ITeamHealthDashboardApp.js';
import { ErrorHandler } from './middleware/ErrorHandler.js';

@injectable()
export class TeamHealthDashboardApp implements ITeamHealthDashboardApp {
  public expressApp: Express;

  constructor(
    @inject(TYPES.Config) private config: IConfig,
    @inject(TYPES.MongoDbClient) private mongoDbClient: IMongoDbClient,
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.ErrorHandler) private errorHandler: ErrorHandler,
  ) {
    this.expressApp = express();
    this.configureCors();
    this.configureMiddleware();
    this.configureRoutes();
    this.configureErrorHandling();
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

  private configureMiddleware(): void {
    this.expressApp.use(bodyParser.json());
    this.expressApp.use(bodyParser.urlencoded({ extended: true }));
  }

  private configureRoutes(): void {
    this.expressApp.get('/', (req: Request, res: Response) => {
      res.send('Team Health Dashboard API');
    });

    this.expressApp.use('/health', healthCheckRouter);
    this.expressApp.use('/api', metricsRouter);
    this.expressApp.use('/api/auth', authRouter);
  }

  private configureErrorHandling(): void {
    // Use the ErrorHandler middleware
    this.expressApp.use(this.errorHandler.handle);

    // Keep the default error handler as a fallback
    this.expressApp.use(
      (err: Error, req: Request, res: Response, _next: NextFunction) => {
        this.logger.error('Unhandled error', err);
        res
          .status(500)
          .json({ message: 'Internal server error', error: err.message });
      },
    );
  }
}
