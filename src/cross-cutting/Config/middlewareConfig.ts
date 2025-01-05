import type {
  IRateLimitConfig,
  ISecurityHeadersConfig,
} from '../../interfaces/index.js';

export const rateLimitConfig: IRateLimitConfig = {
  windowMs:
    process.env.NODE_ENV === 'e2e'
      ? 1 * 1000 // 1 second for e2e tests
      : 15 * 60 * 1000, // 15 minutes for other environments
  maxRequests:
    process.env.NODE_ENV === 'e2e'
      ? 1000 // Higher limit for e2e tests
      : 100, // Normal limit for other environments
  message: 'Too many requests from this IP, please try again later',
};

export const securityHeadersConfig: ISecurityHeadersConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  xssProtection: true,
  noSniff: true,
  frameOptions: 'DENY',
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true,
  },
};
