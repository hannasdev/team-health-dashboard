import { Request, Response, NextFunction, Application, json } from 'express';
import { inject, injectable } from 'inversify';

import { TYPES } from '../../../utils/types.js';
import {
  SecurityEventType,
  SecurityEventSeverity,
} from '../../../services/SecurityLogger/SecurityLogger.js';

import type {
  ILogger,
  ISecurityHeadersMiddleware,
  ISecurityHeadersConfig,
  ISecurityLogger,
  ISecurityRequest,
} from '../../../interfaces/index.js';

@injectable()
export class SecurityHeadersMiddleware implements ISecurityHeadersMiddleware {
  private config: ISecurityHeadersConfig;
  private cspReportingConfigured: boolean = false;

  constructor(
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.SecurityLogger) private securityLogger: ISecurityLogger,
    @inject(TYPES.SecurityHeadersConfig) config: ISecurityHeadersConfig,
  ) {
    this.config = {
      contentSecurityPolicy: config?.contentSecurityPolicy ?? true,
      xssProtection: config?.xssProtection ?? true,
      noSniff: config?.noSniff ?? true,
      frameOptions: config?.frameOptions ?? 'DENY',
      hsts: config?.hsts ?? {
        maxAge: 15552000,
        includeSubDomains: true,
        preload: true,
      },
    };

    this.logger.info('Security headers middleware initialized', {
      enabledHeaders: {
        contentSecurityPolicy: !!this.config.contentSecurityPolicy,
        xssProtection: !!this.config.xssProtection,
        noSniff: !!this.config.noSniff,
        frameOptions: !!this.config.frameOptions,
        hsts: !!this.config.hsts,
      },
    });
  }

  public handle(req: Request, res: Response, next: NextFunction): void {
    try {
      this.logger.debug('Applying security headers to request', {
        method: req.method,
        path: req.path,
        ip: req.ip,
      });
      // Content Security Policy
      if (this.config.contentSecurityPolicy) {
        const cspValue =
          typeof this.config.contentSecurityPolicy === 'string'
            ? this.config.contentSecurityPolicy
            : this.getDefaultCsp();
        res.setHeader('Content-Security-Policy', cspValue);
      }

      // XSS Protection
      if (this.config.xssProtection) {
        const xssValue =
          typeof this.config.xssProtection === 'string'
            ? this.config.xssProtection
            : '1; mode=block';
        res.setHeader('X-XSS-Protection', xssValue);
      }

      // No Sniff
      if (this.config.noSniff) {
        res.setHeader('X-Content-Type-Options', 'nosniff');
      }

      // Frame Options
      if (this.config.frameOptions) {
        const frameValue =
          typeof this.config.frameOptions === 'string'
            ? this.config.frameOptions
            : 'DENY';
        res.setHeader('X-Frame-Options', frameValue);
      }

      // HSTS
      if (this.config.hsts) {
        const hstsConfig =
          typeof this.config.hsts === 'object'
            ? this.config.hsts
            : {
                maxAge: 15552000,
                includeSubDomains: true,
                preload: true,
              };

        let hstsValue = `max-age=${hstsConfig.maxAge}`;
        if (hstsConfig.includeSubDomains) {
          hstsValue += '; includeSubDomains';
        }
        if (hstsConfig.preload) {
          hstsValue += '; preload';
        }

        // Add CSP reporting
        if (this.config.contentSecurityPolicy) {
          const cspValue =
            typeof this.config.contentSecurityPolicy === 'string'
              ? this.config.contentSecurityPolicy
              : this.getDefaultCsp();

          res.setHeader(
            'Content-Security-Policy-Report-Only',
            `${cspValue}; report-uri /api/csp-report`,
          );
        }

        res.setHeader('Strict-Transport-Security', hstsValue);
      }

      // Additional Security Headers
      res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      res.setHeader('X-Download-Options', 'noopen');

      this.logger.info('Successfully applied all security headers', {
        method: req.method,
        path: req.path,
        ip: req.ip,
      });

      next();
    } catch (error) {
      const securityReq: ISecurityRequest = {
        method: req.method,
        path: req.path || req.url,
        ip: req.ip || req.socket.remoteAddress || 'unknown',
        get: req.get?.bind(req) || (() => undefined),
        user: (req as any).user,
      };

      this.logger.error('Failed to apply security headers', error as Error, {
        method: req.method,
        path: req.path,
        ip: req.ip,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      // Log security header failures
      this.securityLogger.logSecurityEvent(
        this.securityLogger.createSecurityEvent(
          SecurityEventType.SECURITY_HEADER_FAILURE,
          securityReq,
          { error: error instanceof Error ? error.message : 'Unknown error' },
          SecurityEventSeverity.HIGH,
        ),
      );

      next(error);
    }
  }

  private getDefaultCsp(): string {
    const directives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      'upgrade-insecure-requests',
    ];

    this.logger.debug('Generated default CSP directives', { directives });

    return directives.join('; ');
  }

  public configureCspReporting(app: Application): void {
    if (this.cspReportingConfigured) {
      this.logger.debug('CSP reporting already configured, skipping');
      return;
    }

    this.logger.info('Configuring CSP reporting endpoint');

    app.post('/api/csp-report', json(), (req: Request, res: Response) => {
      const securityReq: ISecurityRequest = {
        method: req.method,
        path: req.path || req.url,
        ip: req.ip || req.socket.remoteAddress || 'unknown',
        get: req.get?.bind(req) || (() => undefined),
        user: (req as any).user,
      };

      this.logger.warn('CSP violation reported', {
        ip: securityReq.ip,
        report: req.body,
      });

      this.securityLogger.logSecurityEvent(
        this.securityLogger.createSecurityEvent(
          SecurityEventType.CSP_VIOLATION,
          securityReq,
          { report: req.body },
          SecurityEventSeverity.HIGH,
        ),
      );
      res.status(204).end();
    });

    this.cspReportingConfigured = true;
    this.logger.info('CSP reporting endpoint configured successfully');
  }
}
