// src/interfaces/IRepositoryController.ts
import { NextFunction } from 'express';

import type { IAuthenticatedRequest } from '../../middleware/AuthMiddleware/index.js';
import type { IEnhancedResponse } from '../../middleware/interfaces';

export interface IRepositoryController {
  /**
   * Add a new repository
   */
  addRepository(
    req: IAuthenticatedRequest,
    res: IEnhancedResponse,
    next: NextFunction,
  ): Promise<void>;

  /**
   * Remove (archive) a repository
   */
  removeRepository(
    req: IAuthenticatedRequest,
    res: IEnhancedResponse,
    next: NextFunction,
  ): Promise<void>;

  /**
   * Get a repository by ID
   */
  getRepository(
    req: IAuthenticatedRequest,
    res: IEnhancedResponse,
    next: NextFunction,
  ): Promise<void>;

  /**
   * List repositories with optional filters
   */
  listRepositories(
    req: IAuthenticatedRequest,
    res: IEnhancedResponse,
    next: NextFunction,
  ): Promise<void>;

  /**
   * Update repository status
   */
  updateRepositoryStatus(
    req: IAuthenticatedRequest,
    res: IEnhancedResponse,
    next: NextFunction,
  ): Promise<void>;
}
