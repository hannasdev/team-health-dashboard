// jest.setup.ts
import 'reflect-metadata';
import { jest } from '@jest/globals';

process.env.NODE_ENV = 'test';

global.jest = jest;
