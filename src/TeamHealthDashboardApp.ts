// src/TeamHealthDashboardApp.ts
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
  ICorsMiddleware,
} from './interfaces/index.js';

@injectable()
export class TeamHealthDashboardApp implements ITeamHealthDashboardApp {
  public expressApp: Express;

  constructor(
    @inject(TYPES.Config) private config: IConfig,
    @inject(TYPES.MongoDbClient) private mongoDbClient: IMongoDbClient,
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.ErrorHandler) private errorHandler: IErrorHandler,
    @inject(TYPES.CorsMiddleware) private corsMiddleware: ICorsMiddleware,
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
    this.expressApp.use(this.corsMiddleware.handle);
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
