// setupTest.ts
import 'reflect-metadata';
import { TextEncoder, TextDecoder } from 'util';

import { jest } from '@jest/globals';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

process.env.NODE_ENV = 'test';
process.env.GOOGLE_SHEETS_ID = 'test-id';
process.env.GOOGLE_SHEETS_CLIENT_EMAIL = 'test-user';
process.env.GOOGLE_SHEETS_PRIVATE_KEY = 'test-key';
process.env.REPO_TOKEN = 'github_pat_test';
process.env.REPO_OWNER = 'test-user';
process.env.REPO_REPO = 'test-org/test-repo';
process.env.PORT = '3000';
process.env.CORS_ORIGIN = 'http://localhost:3000,null';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.REFRESH_TOKEN_SECRET = 'test-jwt-refresh-secret';
process.env.LOG_LEVEL = 'info';
process.env.LOG_FORMAT = 'json';
process.env.LOG_FILE_PATH = './logs';

(global as any).jest = jest;
