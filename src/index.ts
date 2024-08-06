// src/index.ts
import 'reflect-metadata';
import '@/loadEnv'; // This should be the first import
import app from '@/app';

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
