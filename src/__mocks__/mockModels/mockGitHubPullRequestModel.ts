export const createMockGitHubPullRequestModel = () => ({
  find: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  exec: jest.fn(),
  insertMany: jest.fn(),
});
