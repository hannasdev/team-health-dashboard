// src/services/SecurityLogger/securityTestHelpers.ts
import type { ISecurityRequest } from '../../interfaces/index.js';

interface ISecurityRequestWithHeaders extends ISecurityRequest {
  'set-cookie'?: string[];
}

export const createBaseMockExpressRequest = () => ({
  accepts: jest.fn(),
  acceptsCharsets: jest.fn(),
  acceptsEncodings: jest.fn(),
  acceptsLanguages: jest.fn(),
  range: jest.fn(),
  param: jest.fn(),
  is: jest.fn(),
  header: jest.fn(),
  // Add other Express.Request methods
});

export const createMockRequest = (
  overrides?: Partial<ISecurityRequestWithHeaders>,
): ISecurityRequest => {
  const get = jest
    .fn()
    .mockImplementation((name: string): string | string[] | undefined => {
      const normalizedName = name.toLowerCase();
      if (normalizedName === 'set-cookie') {
        return overrides?.['set-cookie'];
      }
      return normalizedName === 'user-agent'
        ? (overrides?.['user-agent'] ?? 'test-agent')
        : normalizedName === 'authorization'
          ? overrides?.authorization
          : '';
    });

  return {
    ...createBaseMockExpressRequest(),
    method: 'GET',
    path: '/test',
    ip: '127.0.0.1',
    'user-agent': 'test-agent',
    securityEvent: undefined,
    cookie: undefined,
    'x-api-key': undefined,
    authorization: undefined,
    get,
    user: overrides?.user ?? { id: '123', email: 'test@example.com' },
    ...overrides,
  } as ISecurityRequest;
};
