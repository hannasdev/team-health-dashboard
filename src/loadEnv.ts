// src/loadEnv.ts
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '../.env') });

// Log environment variables (for debugging, remove in production)
console.log('Environment variables:');
console.log('GOOGLE_SHEETS_ID:', process.env.GOOGLE_SHEETS_ID);
console.log(
  'GOOGLE_SHEETS_API_KEY:',
  process.env.GOOGLE_SHEETS_API_KEY ? 'Set' : 'Not set',
);
console.log('REPO_TOKEN:', process.env.REPO_TOKEN ? 'Set' : 'Not set');
console.log('REPO_OWNER:', process.env.REPO_OWNER);
console.log('REPO_REPO:', process.env.REPO_REPO);
console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN || '*');
