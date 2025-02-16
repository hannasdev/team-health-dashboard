import type { ICspDirectives } from './ICspDirectives';

export interface ISecurityHeadersConfig {
  contentSecurityPolicy?:
    | boolean
    | string
    | {
        directives: ICspDirectives;
      };
  xssProtection?: boolean | string;
  noSniff?: boolean;
  frameOptions?: boolean | string;
  hsts?:
    | boolean
    | {
        maxAge: number;
        includeSubDomains: boolean;
        preload: boolean;
      };
}
