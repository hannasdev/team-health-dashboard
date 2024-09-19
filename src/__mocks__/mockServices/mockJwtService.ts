import type { IJwtService } from '../../interfaces';

export function createMockJwtService(): jest.Mocked<IJwtService> {
  return {
    sign: jest.fn(),
    verify: jest.fn(),
    decode: jest.fn(),
  };
}
