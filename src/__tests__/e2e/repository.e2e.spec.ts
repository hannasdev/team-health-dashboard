import {
  retryRequest,
  createTestUser,
  loginUser,
  refreshAccessToken,
  wait,
} from './helpers/apiHelpers';
import { REPOSITORY_ENDPOINTS } from './helpers/constants';
import { RepositoryStatus } from '../../interfaces/IRepository';

interface RepositoryResponse {
  success: boolean;
  data: {
    repository: {
      _id: string;
      owner: string;
      name: string;
      fullName: string;
      status: RepositoryStatus;
      createdAt: string;
      updatedAt: string;
      metadata?: {
        isPrivate: boolean;
        description?: string;
        defaultBranch: string;
        topics?: string[];
        language?: string;
      };
      settings?: {
        syncEnabled: boolean;
        syncInterval?: number;
        branchPatterns?: string[];
        labelPatterns?: string[];
      };
      __v?: number;
    };
  };
}

interface ListRepositoriesResponse {
  success: boolean;
  data: {
    items: Array<RepositoryResponse['data']['repository']>;
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  };
}

interface ErrorResponse {
  success: false;
  error: string;
  details?: any;
  statusCode: number;
}

describe('E2E Repository', () => {
  let accessToken: string;
  let refreshToken: string;
  let testUser: { id: string; email: string; password: string };
  let testRepoId: string;

  beforeAll(async () => {
    console.log('Starting E2E Repository tests setup');
    await retryRequest('get', '/health');
    console.log('App is ready, proceeding with tests');
  }, 60000);

  beforeEach(async () => {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        testUser = await createTestUser();
        const result = await loginUser(testUser.email, testUser.password);

        if (result.userAccessToken && result.userRefreshToken) {
          accessToken = result.userAccessToken;
          refreshToken = result.userRefreshToken;
          break;
        }
      } catch (error) {
        attempts++;
        if (attempts === maxAttempts) {
          throw error;
        }
        await wait(5000 * attempts);
      }
    }
  }, 30000);

  const runTest = async (testName: string, testFn: () => Promise<void>) => {
    console.group(testName);
    try {
      await testFn();
      console.log('✓ Test passed');
    } catch (error) {
      console.error('✕ Test failed');
      console.error('Error:', error);
      throw error;
    } finally {
      console.groupEnd();
    }
  };

  describe('POST /api/repositories', () => {
    it('should create repository with valid data', () =>
      runTest('Create Repository', async () => {
        const repoData = {
          owner: 'testorg',
          name: 'test-repo',
          credentials: {
            type: 'token' as const,
            value: 'test-token',
          },
          status: RepositoryStatus.ACTIVE,
          fullName: 'testorg/test-repo', // Add fullName
          createdAt: new Date(), // Add createdAt
          metadata: {
            // Add metadata
            isPrivate: true,
            defaultBranch: 'main',
            description: '',
            topics: [],
            language: 'unknown',
          },
        };

        const response = await retryRequest<RepositoryResponse>(
          'post',
          REPOSITORY_ENDPOINTS.CREATE_REPOSITORY,
          repoData,
          { Authorization: `Bearer ${accessToken}` },
        );

        console.log('Response data:', JSON.stringify(response.data, null, 2));

        expect(response.status).toBe(201);
        expect(response.data.success).toBe(true);
        expect(response.data.data.repository).toBeDefined();
        expect(response.data.data.repository.owner).toBe(repoData.owner);
        expect(response.data.data.repository.name).toBe(repoData.name);
        expect(response.data.data.repository.fullName).toBe(
          `${repoData.owner}/${repoData.name}`,
        );
        expect(response.data.data.repository.status).toBe(
          RepositoryStatus.ACTIVE,
        );

        // Store repo ID from _id field
        testRepoId = response.data.data.repository._id;
        console.log('Stored repository ID:', testRepoId);

        // Verify stored ID
        expect(testRepoId).toBeDefined();
        expect(typeof testRepoId).toBe('string');
        expect(testRepoId).toMatch(/^[0-9a-fA-F]{24}$/);
      }));

    it('should reject repository creation with invalid data', () =>
      runTest('Invalid Repository Creation', async () => {
        const invalidData = {
          owner: '', // Invalid: empty owner
          name: 'test-repo',
        };

        const response = await retryRequest<ErrorResponse>(
          'post',
          REPOSITORY_ENDPOINTS.CREATE_REPOSITORY,
          invalidData,
          { Authorization: `Bearer ${accessToken}` },
        );

        expect(response.status).toBe(400);
        expect(response.data.success).toBe(false);
        expect(response.data.error).toBe('Owner and name are required');
      }));
  });

  describe('GET /api/repositories', () => {
    it('should list repositories with pagination', () =>
      runTest('List Repositories', async () => {
        const response = await retryRequest<ListRepositoriesResponse>(
          'get',
          `${REPOSITORY_ENDPOINTS.LIST_REPOSITORIES}?page=0&pageSize=10`,
          null,
          { Authorization: `Bearer ${accessToken}` },
        );

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(Array.isArray(response.data.data.items)).toBe(true);
        expect(response.data.data).toHaveProperty('total');
        expect(response.data.data).toHaveProperty('page');
        expect(response.data.data).toHaveProperty('pageSize');
        expect(response.data.data).toHaveProperty('hasMore');
      }));

    it('should filter repositories by status', () =>
      runTest('Filter by Status', async () => {
        const response = await retryRequest<ListRepositoriesResponse>(
          'get',
          `${REPOSITORY_ENDPOINTS.LIST_REPOSITORIES}?status=${RepositoryStatus.ACTIVE}`,
          null,
          { Authorization: `Bearer ${accessToken}` },
        );

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        response.data.data.items.forEach(repo => {
          expect(repo.status).toBe(RepositoryStatus.ACTIVE);
        });
      }));
  });

  describe('GET /api/repositories/:id', () => {
    it('should retrieve repository by ID', () =>
      runTest('Get Repository', async () => {
        // Verify we have a valid repo ID before making the request
        expect(testRepoId).toBeDefined();
        console.log('Attempting to fetch repository with ID:', testRepoId);

        const response = await retryRequest<RepositoryResponse>(
          'get',
          REPOSITORY_ENDPOINTS.GET_REPOSITORY(testRepoId),
          null,
          { Authorization: `Bearer ${accessToken}` },
        );

        console.log(
          'Get repository response:',
          JSON.stringify(response.data, null, 2),
        );

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.data.repository).toBeDefined();
        expect(response.data.data.repository._id).toBe(testRepoId);
      }));

    it('should handle non-existent repository', () =>
      runTest('Non-existent Repository', async () => {
        const nonExistentId = '000000000000000000000000';
        const response = await retryRequest<ErrorResponse>(
          'get',
          REPOSITORY_ENDPOINTS.GET_REPOSITORY(nonExistentId),
          null,
          { Authorization: `Bearer ${accessToken}` },
        );

        expect(response.status).toBe(404);
        expect(response.data.success).toBe(false);
        expect(response.data.error).toBe('Repository not found');
      }));
  });

  describe('PATCH /api/repositories/:id/status', () => {
    it('should update repository status', () =>
      runTest('Update Status', async () => {
        const newStatus = RepositoryStatus.INACTIVE;
        const response = await retryRequest<RepositoryResponse>(
          'patch',
          REPOSITORY_ENDPOINTS.UPDATE_STATUS(testRepoId),
          { status: newStatus },
          { Authorization: `Bearer ${accessToken}` },
        );

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.data.repository.status).toBe(newStatus);
      }));

    it('should reject invalid status updates', () =>
      runTest('Invalid Status Update', async () => {
        const response = await retryRequest<ErrorResponse>(
          'patch',
          REPOSITORY_ENDPOINTS.UPDATE_STATUS(testRepoId),
          { status: 'invalid_status' },
          { Authorization: `Bearer ${accessToken}` },
        );

        expect(response.status).toBe(400);
        expect(response.data.success).toBe(false);
        expect(response.data.error).toBe('Invalid status value');
      }));
  });

  describe('DELETE /api/repositories/:id', () => {
    it('should archive repository', () =>
      runTest('Archive Repository', async () => {
        const response = await retryRequest<RepositoryResponse>(
          'delete',
          REPOSITORY_ENDPOINTS.DELETE_REPOSITORY(testRepoId),
          null,
          { Authorization: `Bearer ${accessToken}` },
        );

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);

        // Verify repository is archived
        const getResponse = await retryRequest<RepositoryResponse>(
          'get',
          REPOSITORY_ENDPOINTS.GET_REPOSITORY(testRepoId),
          null,
          { Authorization: `Bearer ${accessToken}` },
        );

        expect(getResponse.status).toBe(200);
        expect(getResponse.data.success).toBe(true);
        expect(getResponse.data.data.repository.status).toBe(
          RepositoryStatus.ARCHIVED,
        );
      }));
  });

  describe('Authentication and Authorization', () => {
    it('should reject requests without authentication', () =>
      runTest('Unauthenticated Request', async () => {
        const response = await retryRequest<ErrorResponse>(
          'get',
          REPOSITORY_ENDPOINTS.LIST_REPOSITORIES,
        );

        expect(response.status).toBe(401);
        expect(response.data.success).toBe(false);
        expect(response.data.error).toBe('No token provided');
      }));

    it('should handle token refresh', () =>
      runTest('Token Refresh', async () => {
        const expiredToken = 'expired_token';

        // First request with expired token
        const firstResponse = await retryRequest<ErrorResponse>(
          'get',
          REPOSITORY_ENDPOINTS.LIST_REPOSITORIES,
          null,
          { Authorization: `Bearer ${expiredToken}` },
        );

        expect(firstResponse.status).toBe(401);
        expect(firstResponse.data.success).toBe(false);

        // Refresh token
        const newAccessToken = await refreshAccessToken(refreshToken);

        // Second request with new token
        const secondResponse = await retryRequest<ListRepositoriesResponse>(
          'get',
          REPOSITORY_ENDPOINTS.LIST_REPOSITORIES,
          null,
          { Authorization: `Bearer ${newAccessToken}` },
        );

        expect(secondResponse.status).toBe(200);
        expect(secondResponse.data.success).toBe(true);
      }));
  });
});
