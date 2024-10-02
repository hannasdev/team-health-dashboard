// setupTests.ts
import 'reflect-metadata';
import { TextEncoder, TextDecoder } from 'util';

import { jest } from '@jest/globals';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

(global as any).jest = jest;
