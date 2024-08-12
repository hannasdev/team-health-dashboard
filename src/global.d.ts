// src/global.d.ts

import { jest } from '@jest/globals';

declare global {
  // eslint-disable-next-line no-var
  var jest: typeof jest;
}

export {};
