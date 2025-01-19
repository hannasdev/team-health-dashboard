// src/presentation/routes/repository.ts
import { Router, NextFunction } from 'express';

import { container } from '../../container.js';
import { RepositoryStatus } from '../../interfaces/IRepository.js';
import { ValidationError } from '../../utils/errors.js';
import { TYPES } from '../../utils/types.js';

import type {
  IAuthenticatedRequest,
  IEnhancedResponse,
  IMiddleware,
  IRateLimitMiddleware,
  ILogger,
  IRepositoryManagementService,
} from '../../interfaces/index.js';

const router = Router();

// Get service instances
const getRepositoryService = () =>
  container.get<IRepositoryManagementService>(
    TYPES.RepositoryManagementService,
  );
const getAuthMiddleware = () =>
  container.get<IMiddleware>(TYPES.AuthMiddleware);
const getRateLimitMiddleware = () =>
  container.get<IRateLimitMiddleware>(TYPES.RateLimitMiddleware);
const getLogger = () => container.get<ILogger>(TYPES.Logger);

// Apply auth middleware to all routes
router.use((req, res, next) =>
  getAuthMiddleware().handle(
    req as unknown as IAuthenticatedRequest,
    res as IEnhancedResponse,
    next as NextFunction,
  ),
);

// Apply rate limiting to all routes
router.use((req, res, next) =>
  getRateLimitMiddleware().handle(
    req as unknown as IAuthenticatedRequest,
    res as IEnhancedResponse,
    next as NextFunction,
  ),
);

// Create new repository
router.post('/', async (req, res, next) => {
  if (!next) {
    throw new Error('Next function is required');
  }

  try {
    const logger = getLogger();
    logger.debug('Creating new repository', { body: req.body });

    const { owner, name, credentials } = req.body;

    if (!owner || !name) {
      throw new ValidationError('Owner and name are required');
    }

    if (credentials && (!credentials.type || !credentials.value)) {
      throw new ValidationError('Invalid credentials format');
    }

    const repository = await getRepositoryService().addRepository({
      owner,
      name,
      credentials,
      status: RepositoryStatus.ACTIVE,
      createdAt: new Date(),
    });

    logger.info('Repository created successfully', { id: repository.id });

    res.status(201).json({
      success: true,
      data: { repository },
    });
  } catch (error) {
    next(error);
  }
});

// List repositories with filters
router.get('/', async (req, res, next) => {
  if (!next) {
    throw new Error('Next function is required');
  }

  try {
    const logger = getLogger();
    const {
      page = '0',
      pageSize = '10',
      status,
      owner,
      search,
      syncEnabled,
      sort,
      sortField,
      sortOrder,
    } = req.query;

    logger.debug('Listing repositories with filters', { query: req.query });

    const filters = {
      page: parseInt(page as string, 10),
      pageSize: parseInt(pageSize as string, 10),
      status: status as RepositoryStatus | undefined,
      owner: owner as string | undefined,
      search: search as string | undefined,
      syncEnabled: syncEnabled === 'true',
      ...(sort && {
        sort: {
          field: sortField as string,
          order: sortOrder as 'asc' | 'desc',
        },
      }),
    };

    const repositories = await getRepositoryService().listRepositories(filters);

    res.json({
      success: true,
      data: repositories,
    });
  } catch (error) {
    next(error);
  }
});

// Get repository by ID
router.get('/:id', async (req, res, next) => {
  if (!next) {
    throw new Error('Next function is required');
  }

  try {
    const logger = getLogger();
    const { id } = req.params;

    logger.debug('Fetching repository by ID', { id });

    const repository = await getRepositoryService().getRepository(id);

    res.json({
      success: true,
      data: { repository },
    });
  } catch (error) {
    next(error);
  }
});

// Delete (archive) repository
router.delete('/:id', async (req, res, next) => {
  if (!next) {
    throw new Error('Next function is required');
  }

  try {
    const logger = getLogger();
    const { id } = req.params;

    logger.debug('Archiving repository', { id });

    await getRepositoryService().removeRepository(id);

    res.json({
      success: true,
      message: 'Repository archived successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Update repository status
router.patch('/:id/status', async (req, res, next) => {
  if (!next) {
    throw new Error('Next function is required');
  }

  try {
    const logger = getLogger();
    const { id } = req.params;
    const { status } = req.body;

    logger.debug('Updating repository status', { id, status });

    if (!Object.values(RepositoryStatus).includes(status)) {
      throw new ValidationError('Invalid status value');
    }

    const repository = await getRepositoryService().updateRepositoryStatus(
      id,
      status,
    );

    res.json({
      success: true,
      data: { repository },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
