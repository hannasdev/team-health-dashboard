import { NextFunction, Application } from 'express';
import { inject, injectable } from 'inversify';

import { TYPES } from '../../../utils/types.js';
import {
  SecurityEventType,
  SecurityEventSeverity,
} from '../../../services/SecurityLogger/SecurityLogger.js';

import type {
  ILogger,
  ISecurityHeadersConfig,
  ISecurityLogger,
  ISecurityRequest,
  IMiddleware,
  IEnhancedRequest,
  IEnhancedResponse,
} from '../../../interfaces/index.js';

@injectable()
export class SecurityHeadersMiddleware implements IMiddleware {
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

  public handle(
    req: IEnhancedRequest,
    res: IEnhancedResponse,
    next: NextFunction,
  ): void {
    try {
      this.applySecurityHeaders(req, res);
      next();
    } catch (error) {
      this.handleSecurityError(req, error, next);
    }
  }

  private applySecurityHeaders(
    req: IEnhancedRequest,
    res: IEnhancedResponse,
  ): void {
    this.logger.debug('Applying security headers to request', {
      method: req.method,
      path: req.path,
      ip: req.ip,
    });

    const setSecureHeader = (
      name: string,
      value: string | number | readonly string[],
    ) => {
      const originalValue = String(value);
      // Convert to string if it's not already
      const stringValue = Array.isArray(value)
        ? value.join(', ')
        : String(value);

      const limitedValue = this.enforceHeaderSizeLimit(stringValue);

      if (limitedValue !== originalValue) {
        this.logger.warn('Header value was truncated', {
          header: name,
          originalLength: originalValue.length,
          newLength: limitedValue.length,
        });
      }

      res.setHeader(name, limitedValue);
    };

    // Content Security Policy
    if (this.config.contentSecurityPolicy) {
      const cspValue =
        typeof this.config.contentSecurityPolicy === 'string'
          ? this.sanitizeCspValue(this.config.contentSecurityPolicy)
          : this.getDefaultCsp();

      setSecureHeader('Content-Security-Policy', cspValue);
      setSecureHeader(
        'Content-Security-Policy-Report-Only',
        `${cspValue}; report-uri /api/csp-report`,
      );
    }

    // XSS Protection
    if (this.config.xssProtection) {
      const xssValue =
        typeof this.config.xssProtection === 'string'
          ? this.config.xssProtection
          : '1; mode=block';

      setSecureHeader('X-XSS-Protection', xssValue);
    }

    // No Sniff
    if (this.config.noSniff) {
      setSecureHeader('X-Content-Type-Options', 'nosniff');
    }

    // Frame Options
    if (this.config.frameOptions) {
      const frameValue =
        typeof this.config.frameOptions === 'string'
          ? this.config.frameOptions
          : 'DENY';

      setSecureHeader('X-Frame-Options', frameValue);
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

      setSecureHeader('Strict-Transport-Security', hstsValue);
    }

    // Additional Security Headers
    setSecureHeader('X-Permitted-Cross-Domain-Policies', 'none');
    setSecureHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    setSecureHeader('X-Download-Options', 'noopen');

    this.logger.info('Successfully applied all security headers', {
      method: req.method,
      path: req.path,
      ip: req.ip,
    });
  }

  private sanitizeCspValue(value: string): string {
    // Remove any HTML tags while preserving valid CSP directives
    const sanitized = value.replace(/<[^>]*>/g, '');

    // Ensure we maintain valid CSP structure
    const validDirectives = sanitized
      .split(';')
      .map(directive => directive.trim())
      .filter(directive => {
        // Basic validation of directive structure
        const [directiveName, ...sources] = directive.split(/\s+/);
        return directiveName && sources.length > 0;
      })
      .join('; ');

    return validDirectives;
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

  private getConfiguredCspValue(config: ISecurityHeadersConfig): string {
    if (typeof config.contentSecurityPolicy === 'string') {
      return this.sanitizeCspValue(config.contentSecurityPolicy);
    }
    return this.getDefaultCsp();
  }

  public configureCspReporting(app: Application): void {
    if (this.cspReportingConfigured) {
      this.logger.debug('CSP reporting already configured, skipping');
      return;
    }

    this.logger.info(
      'Configuring CSP reporting endpoint - This functionality is not yet implemented',
    );

    // TODO: Implement CSP reporting endpoint
    // app.post(
    //   '/api/csp-report',
    //   (req: IEnhancedRequest, res: ISecurityResponse) => {
    //     const securityRequest: ISecurityRequest = {
    //       method: req.method,
    //       path: req.path,
    //       ip: req.ip,
    //       user: req.user,
    //       socket: { remoteAddress: req.ip },
    //     };

    //     this.logger.warn('CSP violation reported', {
    //       ip: req.ip,
    //       report: req.method,
    //     });

    //     this.securityLogger.logSecurityEvent(
    //       this.securityLogger.createSecurityEvent(
    //         SecurityEventType.CSP_VIOLATION,
    //         securityRequest,
    //         { report: req.method },
    //         SecurityEventSeverity.HIGH,
    //       ),
    //     );
    //     res.status(204).end();
    //   },
    // );

    // this.cspReportingConfigured = true;
    // this.logger.info('CSP reporting endpoint configured successfully');
  }

  private enforceHeaderSizeLimit(
    value: string,
    maxLength: number = 16384,
  ): string {
    if (value.length <= maxLength) {
      return value;
    }

    this.logger.warn('Header value exceeded maximum length, truncating', {
      originalLength: value.length,
      maxLength,
    });

    // For CSP, try to preserve complete directives
    if (value.includes(';')) {
      const directives = value.split(';');
      let result = '';

      for (const directive of directives) {
        if ((result + directive + ';').length > maxLength) {
          break;
        }
        result += (result ? '; ' : '') + directive.trim();
      }
      return result;
    }

    return value.slice(0, maxLength);
  }

  private handleSecurityError(
    req: IEnhancedRequest,
    error: unknown,
    next: NextFunction,
  ): void {
    this.logger.error('Failed to apply security headers', error as Error, {
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    try {
      const securityRequest: ISecurityRequest = {
        method: req.method,
        path: req.path,
        ip: req.ip,
        user: req.user,
        socket: { remoteAddress: req.ip },
      };

      try {
        // Log security header failures
        const securityEvent = this.securityLogger.createSecurityEvent(
          SecurityEventType.SECURITY_HEADER_FAILURE,
          securityRequest,
          { error: error instanceof Error ? error.message : 'Unknown error' },
          SecurityEventSeverity.HIGH,
        );
        this.securityLogger.logSecurityEvent(securityEvent);
      } catch (loggerError) {
        this.logger.error(
          'Failed to log security event',
          loggerError as Error,
          {
            originalError:
              error instanceof Error ? error.message : 'Unknown error',
          },
        );
      }
    } finally {
      next(error);
    }
  }
}
