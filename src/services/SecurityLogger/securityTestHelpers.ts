// src/services/SecurityLogger/securityTestHelpers.ts
import type { IEnhancedRequest } from '../../interfaces/index.js';

export const createMockRequest = (
  overrides?: Partial<IEnhancedRequest>,
): IEnhancedRequest => ({
  method: 'GET',
  path: '/test',
  url: '/test',
  originalUrl: '/test',
  ip: '127.0.0.1',
  socket: {
    remoteAddress: '127.0.0.1',
  },
  headers: {
    'user-agent': 'test-agent',
  },
  body: {},
  get: jest.fn(name => {
    if (name.toLowerCase() === 'user-agent') return 'test-agent';
    return undefined;
  }),
  user: { id: '123', email: 'test@example.com' },
  ...overrides,
});
