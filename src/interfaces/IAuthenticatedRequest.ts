// src/interfaces/middleware/IAuthenticatedRequest.ts
import { RepositoryStatus } from './IRepository.js';

import type { IEnhancedRequest } from './IEnhancedRequest.js';

export interface IAuthenticatedRequest extends IEnhancedRequest {
  user: {
    id: string;
    email: string;
    exp: number;
  };
  query: {
    page?: string;
    pageSize?: string;
    status?: string | string[];
    owner?: string;
    search?: string;
    syncEnabled?: string;
    sort?: string;
    sortField?: string;
    sortOrder?: string;
  };
  authorization: string;
  params: {
    id: string;
  };
  body: {
    owner: string;
    name: string;
    credentials: {
      token: string;
      type: string;
      value: string;
    };
    status: RepositoryStatus;
  };
}
