// src/app.ts
import express from 'express';
import metricsRoutes from './routes/metrics';

const app = express();

// Use the routes
app.use('/api', metricsRoutes);

export default app;
