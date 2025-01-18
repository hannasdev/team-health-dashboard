// src/TeamHealthDashboardApp.ts
import { IncomingMessage, ServerResponse } from 'http';

import express, { Express, Request, Response, RequestHandler } from 'express';
import { NextFunction } from 'express-serve-static-core';
import { inject, injectable } from 'inversify';

import authRouter from './presentation/routes/auth.js';
import healthCheckRouter from './presentation/routes/healthCheck.js';
import metricsRouter from './presentation/routes/metrics.js';
import repositoryRouter from './presentation/routes/repository.js';
import { TYPES } from './utils/types.js';

import type {
  IConfig,
  ILogger,
  IMongoDbClient,
  ITeamHealthDashboardApp,
  IEnhancedRequest,
  IEnhancedResponse,
  IMiddleware,
  IErrorHandler,
  ISecurityHeadersMiddleware,
  IRateLimitMiddleware,
  ISecurityRequest,
} from './interfaces/index.js';

@injectable()
export class TeamHealthDashboardApp implements ITeamHealthDashboardApp {
  public expressApp: Express;

  constructor(
    @inject(TYPES.Config) private config: IConfig,
    @inject(TYPES.MongoDbClient) private mongoDbClient: IMongoDbClient,
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.ErrorHandler) private errorHandler: IErrorHandler,
    @inject(TYPES.CorsMiddleware) private corsMiddleware: IMiddleware,
    @inject(TYPES.RateLimitMiddleware)
    private rateLimitMiddleware: IRateLimitMiddleware,
    @inject(TYPES.SecurityHeadersMiddleware)
    private securityHeadersMiddleware: ISecurityHeadersMiddleware,
    @inject(TYPES.AuthMiddleware) private authMiddleware: IMiddleware,
  ) {
    this.expressApp = express();
    this.configureJson();
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

  private configureJson(): void {
    const jsonMiddleware: RequestHandler = (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      const parser = express.json();
      parser(
        req as unknown as IncomingMessage,
        res as unknown as ServerResponse<IncomingMessage>,
        next,
      );
    };

    const urlEncodedMiddleware: RequestHandler = (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      const parser = express.urlencoded({ extended: true });
      parser(
        req as unknown as IncomingMessage,
        res as unknown as ServerResponse<IncomingMessage>,
        next,
      );
    };

    this.expressApp.use(jsonMiddleware as any);
    this.expressApp.use(urlEncodedMiddleware as any);
  }

  private configureCors(): void {
    this.expressApp.use((req: Request, res: Response, next) =>
      this.corsMiddleware.handle(
        req as IEnhancedRequest,
        res as IEnhancedResponse,
        next as NextFunction,
      ),
    );

    this.logger.info('CORS configured', {
      corsOrigin: this.config.CORS_ORIGIN,
    });
  }

  private configureMiddleware(): void {
    this.expressApp.use('/api', (req, res, next) =>
      this.rateLimitMiddleware.handle(
        req as IEnhancedRequest,
        res as IEnhancedResponse,
        next as NextFunction,
      ),
    );

    this.logger.info('Basic middleware configured');
  }

  private configureSecurityMiddleware(): void {
    // Security headers should be applied early
    this.expressApp.use((req, res, next) =>
      this.securityHeadersMiddleware.handle(
        req as unknown as ISecurityRequest,
        res as IEnhancedResponse,
        next as NextFunction,
      ),
    );

    // Configure CSP reporting
    this.securityHeadersMiddleware.configureCspReporting(this.expressApp);

    // Rate limiting for API routes
    this.expressApp.use('/api', (req, res, next) =>
      this.rateLimitMiddleware.handle(
        req as unknown as ISecurityRequest,
        res as IEnhancedResponse,
        next as NextFunction,
      ),
    );

    // Security settings
    this.configureSecuritySettings();
  }

  private configureRoutes(): void {
    // Public routes
    this.expressApp.get(
      '/',
      (req: IEnhancedRequest, res: IEnhancedResponse) => {
        res.send('Team Health Dashboard API');
      },
    );

    this.expressApp.use('/health', healthCheckRouter);

    // API routes with rate limiting
    this.expressApp.use('/api/auth', authRouter);

    // Protected routes
    this.expressApp.use('/api', (req, res, next) =>
      this.authMiddleware.handle(
        req as unknown as ISecurityRequest,
        res as IEnhancedResponse,
        next as NextFunction,
      ),
    );
    this.expressApp.use('/api', metricsRouter);
    this.expressApp.use('/api/repositories', repositoryRouter);

    // 404 handler
    this.expressApp.use((req: IEnhancedRequest, res: IEnhancedResponse) => {
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
      (
        err: Error,
        req: IEnhancedRequest,
        res: IEnhancedResponse,
        next: NextFunction,
      ) => {
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

  private configureSecuritySettings(): void {
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
}
