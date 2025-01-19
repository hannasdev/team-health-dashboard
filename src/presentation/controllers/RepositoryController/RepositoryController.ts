import { NextFunction } from 'express';
import { inject, injectable } from 'inversify';

import { RepositoryStatus } from '../../../interfaces/index.js';
import { AppError } from '../../../utils/errors.js';
import { TYPES } from '../../../utils/types.js';

import type {
  IRepositoryManagementService,
  IRepositoryDetails,
  IRepositoryFilters,
  ILogger,
  IApiResponse,
  IAuthenticatedRequest,
  IEnhancedResponse,
  IRepository,
  IRepositoryController,
} from '../../../interfaces/index.js';

@injectable()
export class RepositoryController implements IRepositoryController {
  constructor(
    @inject(TYPES.RepositoryManagementService)
    private readonly repositoryService: IRepositoryManagementService,
    @inject(TYPES.Logger)
    private readonly logger: ILogger,
    @inject(TYPES.ApiResponse)
    private readonly apiResponse: IApiResponse,
  ) {}

  public async addRepository(
    req: IAuthenticatedRequest,
    res: IEnhancedResponse,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { owner, name, credentials } = req.body;

      if (!owner || !name) {
        throw new AppError(400, 'Owner and name are required');
      }

      if (
        credentials &&
        (!credentials.type ||
          !credentials.value ||
          !['token', 'oauth'].includes(credentials.type))
      ) {
        throw new AppError(
          400,
          'Invalid credentials format. Must include type ("token" or "oauth") and value',
        );
      }

      const details: IRepositoryDetails = {
        owner,
        name,
        credentials: credentials
          ? {
              type: credentials.type as 'token' | 'oauth',
              value: credentials.value,
            }
          : undefined,
        status: RepositoryStatus.ACTIVE,
        createdAt: new Date(),
      };

      const repository = await this.repositoryService.addRepository(details);

      res.status(201).json(
        this.apiResponse.createSuccessResponse({
          message: 'Repository added successfully',
          repository,
        }),
      );
    } catch (error) {
      next(error);
    }
  }

  public async removeRepository(
    req: IAuthenticatedRequest,
    res: IEnhancedResponse,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;

      await this.repositoryService.removeRepository(id);

      res.status(200).json(
        this.apiResponse.createSuccessResponse({
          message: 'Repository archived successfully',
        }),
      );
    } catch (error) {
      next(error);
    }
  }

  public async getRepository(
    req: IAuthenticatedRequest,
    res: IEnhancedResponse,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;

      const repository = await this.repositoryService.getRepository(id);

      res.json(this.apiResponse.createSuccessResponse({ repository }));
    } catch (error) {
      next(error);
    }
  }

  public async listRepositories(
    req: IAuthenticatedRequest,
    res: IEnhancedResponse,
    next: NextFunction,
  ): Promise<void> {
    try {
      const filters: IRepositoryFilters = {
        status: req.query.status
          ? Array.isArray(req.query.status)
            ? req.query.status.map(s => s as RepositoryStatus)
            : (req.query.status as RepositoryStatus)
          : undefined,
        owner: String(req.query.owner || ''),
        search: String(req.query.search || ''),
        syncEnabled: req.query.syncEnabled === 'true',
        page: parseInt(req.query.page as string) || 0,
        pageSize: parseInt(req.query.pageSize as string) || 10,
        sort: req.query.sort
          ? {
              field: req.query.sortField as string as
                | keyof IRepository
                | 'lastSync',
              order: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
            }
          : undefined,
      };

      const result = await this.repositoryService.listRepositories(filters);

      res.json(this.apiResponse.createSuccessResponse(result));
    } catch (error) {
      next(error);
    }
  }

  public async updateRepositoryStatus(
    req: IAuthenticatedRequest,
    res: IEnhancedResponse,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!Object.values(RepositoryStatus).includes(status)) {
        throw new AppError(400, 'Invalid status value');
      }

      const repository = await this.repositoryService.updateRepositoryStatus(
        id,
        status,
      );

      res.json(
        this.apiResponse.createSuccessResponse({
          message: 'Repository status updated successfully',
          repository,
        }),
      );
    } catch (error) {
      next(error);
    }
  }
}
