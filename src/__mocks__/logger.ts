import { Logger } from '../utils/logger';

export class MockLogger implements Logger {
  info = jest.fn();
  error = jest.fn();
  warn = jest.fn();
}

export const createMockLogger = () => {
  return new MockLogger();
};
