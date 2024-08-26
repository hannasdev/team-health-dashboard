// src/TeamHealthDashboardApp.ts

import 'reflect-metadata';
import bodyParser from 'body-parser';
import cors from 'cors';
import express, { Express, Request, Response, NextFunction } from 'express';
import { inject, injectable } from 'inversify';

import { ErrorHandler } from './middleware/ErrorHandler.js';
import authRouter from './routes/auth.js';
import healthCheckRouter from './routes/healthCheck.js';
import metricsRouter from './routes/metrics.js';
import { TYPES } from './utils/types.js';

import type {
  ILogger,
  IConfig,
  ITeamHealthDashboardApp,
  IMongoDbClient,
} from './interfaces/index.js';

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
    const allowedOrigins = this.config.CORS_ORIGIN.split(',').map(origin =>
      origin.trim(),
    );

    this.expressApp.use(
      cors({
        origin: (origin, callback) => {
          if (
            !origin ||
            allowedOrigins.includes(origin) ||
            allowedOrigins.includes('*')
          ) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
      }),
    );

    this.expressApp.options('*', cors());
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
