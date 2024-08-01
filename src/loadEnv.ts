// src/loadEnv.ts
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env') });

// Log environment variables (for debugging, remove in production)
console.log('Environment variables:');
console.log('GOOGLE_SHEETS_ID:', process.env.GOOGLE_SHEETS_ID);
console.log(
  'GOOGLE_SHEETS_API_KEY:',
  process.env.GOOGLE_SHEETS_API_KEY ? 'Set' : 'Not set',
);
console.log('GITHUB_TOKEN:', process.env.GITHUB_TOKEN ? 'Set' : 'Not set');
console.log('GITHUB_OWNER:', process.env.GITHUB_OWNER);
console.log('GITHUB_REPO:', process.env.GITHUB_REPO);
console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN || '*');
