// src/global.d.ts

import { jest } from '@jest/globals';

declare global {
  var jest: typeof jest;
}

export {};
