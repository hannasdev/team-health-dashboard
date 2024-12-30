// src/interfaces/IAuthMiddleware.ts
import { NextFunction } from 'express';

import { IEnhancedRequest } from './IEnhancedRequest.js';
import { IEnhancedResponse } from './IEnhancedResponse.js';
import { IMiddleware } from './IMiddleware.js';

export interface IAuthMiddleware extends IMiddleware {}
