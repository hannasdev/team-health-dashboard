// src/__mocks__/externalMocks.ts
import { Octokit } from "@octokit/rest";
import { jest } from "@jest/globals";

export const createMockOctokit = (): jest.Mocked<Octokit> => {
  return {
    paginate: jest.fn(),
    rest: {
      pulls: {
        list: jest.fn(),
      },
    },
    request: jest.fn(),
    graphql: jest.fn(),
    log: {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    },
  } as unknown as jest.Mocked<Octokit>;
};
