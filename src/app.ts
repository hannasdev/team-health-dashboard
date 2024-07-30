// src/app.ts
import 'reflect-metadata';
import express, { Express, Request, Response } from 'express';
import metricsRouter from './routes/metrics';
import { container } from './container';

const app: Express = express();

// Root route
app.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript Server');
});

// Use the metrics router
app.use('/api', metricsRouter);

export default app;
