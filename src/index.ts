// src/index.ts
console.log('Current working directory:', process.cwd());
import 'reflect-metadata';
import '@/loadEnv';
import app from '@/app';

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});

export default app;
