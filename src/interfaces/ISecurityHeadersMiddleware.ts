import { Request, Response, NextFunction, Application } from 'express';

export interface ISecurityHeadersMiddleware {
  handle(req: Request, res: Response, next: NextFunction): void;
  configureCspReporting(app: Application): void;
}
