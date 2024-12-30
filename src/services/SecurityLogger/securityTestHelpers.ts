// src/services/SecurityLogger/securityTestHelpers.ts
import type { ISecurityRequest } from '../../interfaces/index.js';

export const createMockRequest = (
  overrides?: Partial<ISecurityRequest>,
): ISecurityRequest => ({
  method: 'GET',
  path: '/test',
  ip: '127.0.0.1',
  'user-agent': 'test-agent',
  securityEvent: undefined,
  cookie: undefined,
  'x-api-key': undefined,
  authorization: undefined,
  get: jest.fn((name: string) => {
    // Case-insensitive header lookup
    const normalizedName = name.toLowerCase();
    switch (normalizedName) {
      case 'user-agent':
        return overrides?.['user-agent'] ?? 'test-agent';
      case 'authorization':
        return overrides?.authorization;
      default:
        return undefined;
    }
  }),
  user: overrides?.user ?? { id: '123', email: 'test@example.com' },
  ...overrides,
});
