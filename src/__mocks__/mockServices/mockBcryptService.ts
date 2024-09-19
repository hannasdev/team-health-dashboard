import type { IBcryptService } from '../../interfaces/index.js';

export function createMockBcryptService(): jest.Mocked<IBcryptService> {
  return {
    hash: jest.fn(),
    compare: jest.fn(),
  };
}
