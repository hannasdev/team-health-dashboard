import { Request } from 'express';

import type { ISecurityRequest } from '../../interfaces/index.js';

export const createMockSecurityRequest = (
  overrides?: Partial<ISecurityRequest>,
): ISecurityRequest => ({
  method: 'GET',
  path: '/test',
  ip: '127.0.0.1',
  get: jest.fn(name => (name === 'user-agent' ? 'test-agent' : undefined)),
  user: { id: '123' },
  ...overrides,
});

export const createMockExpressRequest = (
  overrides?: Partial<Request>,
): Request =>
  ({
    method: 'GET',
    path: '/test',
    ip: '127.0.0.1',
    get: jest.fn(name => (name === 'user-agent' ? 'test-agent' : undefined)),
    socket: {
      remoteAddress: '127.0.0.1',
      destroy: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
    },
    ...overrides,
  }) as unknown as Request;
