// src/index.ts
console.log('Current working directory:', process.cwd());
import 'reflect-metadata';

import { container } from './container.js';
import { ILogger, IApplication } from './interfaces/index.js';
import { TYPES } from './utils/types.js';

const port = process.env.PORT || 3000;

async function startServer() {
  const logger = container.get<ILogger>(TYPES.Logger);
  const app = container.get<IApplication>(TYPES.Application);

  try {
    await app.initialize();
    app.expressApp.listen(port, () => {
      logger.info(`[server]: Server is running at http://localhost:${port}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error as Error);
    process.exit(1);
  }
}

startServer();

export default container.get<IApplication>(TYPES.Application).expressApp;
