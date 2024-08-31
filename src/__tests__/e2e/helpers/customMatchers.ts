// src/__tests__/e2e/helpers/customMatchers.ts
import { expect } from '@jest/globals';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidMetric(): R;
    }
  }
}

expect.extend({
  toBeValidMetric(received) {
    const pass =
      received &&
      typeof received === 'object' &&
      'id' in received &&
      'metric_category' in received &&
      'metric_name' in received &&
      'value' in received &&
      'timestamp' in received &&
      'unit' in received &&
      'additional_info' in received &&
      'source' in received;

    return {
      message: () => `expected ${received} to be a valid metric object`,
      pass,
    };
  },
});
