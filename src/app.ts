// src/app.ts
import 'reflect-metadata';
import cors from 'cors';
import express, { Express, Request, Response } from 'express';

import { config } from './config/config';
import { container } from './container';
import authRouter from './routes/auth';
import healthCheckRouter from './routes/healthCheck';
import metricsRouter from './routes/metrics';

const app: Express = express();

// Enable CORS for all routes
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = config.CORS_ORIGIN.split(',');
      if (
        !origin ||
        allowedOrigins.indexOf(origin) !== -1 ||
        allowedOrigins.includes('*')
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Root route
app.get('/', (req: Request, res: Response) => {
  res.send('Team Health Dashboard API');
});

// Use the health check router
app.use('/health', healthCheckRouter);

// Use the metrics router
app.use('/api', metricsRouter);

// Use the auth router
app.use('/api/auth', authRouter);

export default app;
