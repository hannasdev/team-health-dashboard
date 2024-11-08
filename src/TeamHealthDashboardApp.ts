// src/TeamHealthDashboardApp.ts
import express, { Express, Request, Response, NextFunction } from 'express';
import { inject, injectable } from 'inversify';

import authRouter from './presentation/routes/auth.js';
import healthCheckRouter from './presentation/routes/healthCheck.js';
import metricsRouter from './presentation/routes/metrics.js';
import { TYPES } from './utils/types.js';

import type {
  IAuthMiddleware,
  IConfig,
  ICorsMiddleware,
  IErrorHandler,
  ILogger,
  IMongoDbClient,
  IRateLimitMiddleware,
  ISecurityHeadersMiddleware,
  ITeamHealthDashboardApp,
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
    @inject(TYPES.RateLimitMiddleware)
    private rateLimitMiddleware: IRateLimitMiddleware,
    @inject(TYPES.SecurityHeadersMiddleware)
    private securityHeadersMiddleware: ISecurityHeadersMiddleware,
    @inject(TYPES.AuthMiddleware) private authMiddleware: IAuthMiddleware,
  ) {
    this.expressApp = express();
    this.configureSecurityMiddleware();
    this.configureCors();
    this.configureMiddleware();
    this.configureRoutes();
    this.configureErrorHandling();

    this.logger.info('Application configured', {
      port: this.config.PORT,
      environment: process.env.NODE_ENV,
      corsOrigin: this.config.CORS_ORIGIN,
    });
  }

  public async initialize(
    options: { skipDatabaseConnection?: boolean } = {},
  ): Promise<void> {
    if (!options.skipDatabaseConnection) {
      try {
        await this.mongoDbClient.connect();
        this.logger.info('Database connection established', {
          databaseUrl: this.maskDatabaseUrl(this.config.DATABASE_URL),
        });
      } catch (error) {
        this.logger.error('Failed to connect to the database', error as Error, {
          databaseUrl: this.maskDatabaseUrl(this.config.DATABASE_URL),
        });
        throw error;
      }
    } else {
      this.logger.info(
        'Skipping database connection as per initialization options',
      );
    }
  }

  private configureCors(): void {
    this.expressApp.use(this.corsMiddleware.handle.bind(this.corsMiddleware));
    this.logger.info('CORS configured', {
      corsOrigin: this.config.CORS_ORIGIN,
    });
  }

  private configureMiddleware(): void {
    this.expressApp.use(express.json({ limit: '10mb' }));
    this.expressApp.use(express.urlencoded({ extended: true, limit: '10mb' }));

    this.logger.info('Basic middleware configured');
  }

  private configureSecurityMiddleware(): void {
    // Security headers should be applied early
    this.expressApp.use((req, res, next) =>
      this.securityHeadersMiddleware.handle(req, res, next),
    );

    // Configure CSP reporting
    this.securityHeadersMiddleware.configureCspReporting(this.expressApp);

    // Rate limiting for API routes
    this.expressApp.use('/api', (req, res, next) =>
      this.rateLimitMiddleware.handle(req, res, next),
    );

    // Security settings
    this.expressApp.disable('x-powered-by');
    this.expressApp.enable('trust proxy');
    this.expressApp.set('env', process.env.NODE_ENV || 'production');
    this.expressApp.set('query parser', 'extended');

    this.logger.info('Security middleware configured', {
      environment: process.env.NODE_ENV,
      trustProxy: true,
      xPoweredBy: false,
    });
  }

  private configureRoutes(): void {
    // Public routes
    this.expressApp.get('/', (req: Request, res: Response) => {
      res.send('Team Health Dashboard API');
    });

    this.expressApp.use('/health', healthCheckRouter);

    // API routes with rate limiting
    this.expressApp.use('/api/auth', authRouter);

    // Protected routes
    this.expressApp.use('/api', (req, res, next) =>
      this.authMiddleware.handle(req, res, next),
    );
    this.expressApp.use('/api', metricsRouter);

    // 404 handler
    this.expressApp.use((req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.path}`,
      });
    });

    this.logger.info('Routes configured');
  }

  private configureErrorHandling(): void {
    this.expressApp.use(
      (err: Error, req: Request, res: Response, next: NextFunction) => {
        this.errorHandler.handle(err, req, res, next);
      },
    );

    this.logger.info('Error handling configured');
  }

  private maskDatabaseUrl(url: string): string {
    try {
      const maskedUrl = new URL(url);
      if (maskedUrl.password) {
        maskedUrl.password = '****';
      }
      return maskedUrl.toString();
    } catch {
      return 'invalid-url';
    }
  }
}
