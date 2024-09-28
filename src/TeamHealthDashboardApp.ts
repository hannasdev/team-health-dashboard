// src/TeamHealthDashboardApp.ts
import bodyParser from 'body-parser';
import cors from 'cors';
import express, { Express, Request, Response, NextFunction } from 'express';
import { inject, injectable } from 'inversify';

import authRouter from './presentation/routes/auth.js';
import healthCheckRouter from './presentation/routes/healthCheck.js';
import metricsRouter from './presentation/routes/metrics.js';
import { TYPES } from './utils/types.js';

import type {
  ILogger,
  IConfig,
  ITeamHealthDashboardApp,
  IMongoDbClient,
  IErrorHandler,
} from './interfaces/index.js';

@injectable()
export class TeamHealthDashboardApp implements ITeamHealthDashboardApp {
  public expressApp: Express;

  constructor(
    @inject(TYPES.Config) private config: IConfig,
    @inject(TYPES.MongoDbClient) private mongoDbClient: IMongoDbClient,
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.ErrorHandler) private errorHandler: IErrorHandler,
  ) {
    this.expressApp = express();
    this.configureCors();
    this.configureMiddleware();
    this.configureRoutes();
    this.configureErrorHandling();
  }

  public async initialize(
    options: { skipDatabaseConnection?: boolean } = {},
  ): Promise<void> {
    if (!options.skipDatabaseConnection) {
      try {
        await this.mongoDbClient.connect();
        this.logger.info('Database connection established');
      } catch (error) {
        this.logger.error('Failed to connect to the database', error as Error);
        throw error;
      }
    } else {
      this.logger.info(
        'Skipping database connection as per initialization options',
      );
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
    this.expressApp.use(express.json());
    this.expressApp.use(express.urlencoded({ extended: true }));
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
    this.expressApp.use(
      (err: Error, req: Request, res: Response, next: NextFunction) => {
        this.errorHandler.handle(err, req, res, next);
      },
    );
  }
}
