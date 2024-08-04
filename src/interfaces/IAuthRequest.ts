// src/interfaces/IAuthRequest.ts
import { IncomingHttpHeaders } from 'http';

import { Request } from 'express';

export interface IAuthRequest extends Request {
  headers: IncomingHttpHeaders;
  user?: { id: string; email: string };
}
