// src/controllers/AuthController.ts
import { compare, hash } from 'bcrypt';
import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { sign } from 'jsonwebtoken';

import { IConfig, ILogger, IUserRepository } from '@/interfaces';
import { IAuthController } from '@/interfaces/IAuthController';
import { TYPES } from '@/utils/types';

@injectable()
export class AuthController implements IAuthController {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: IUserRepository,
    @inject(TYPES.Config) private config: IConfig,
    @inject(TYPES.Logger) private logger: ILogger,
  ) {}

  public async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;
    try {
      const user = await this.userRepository.findByEmail(email);
      if (!user || !(await compare(password, user.password))) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }
      const token = this.generateToken(user.id, user.email);
      res.json({ token });
    } catch (error) {
      this.logger.error('Error in login:', error as Error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  public async register(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;
    try {
      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser) {
        res.status(400).json({ message: 'User already exists' });
        return;
      }
      const hashedPassword = await hash(password, 10);
      const user = await this.userRepository.create(email, hashedPassword);
      const token = this.generateToken(user.id, user.email);
      res.status(201).json({ token });
    } catch (error) {
      this.logger.error('Error in register:', error as Error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  private generateToken(userId: string, email: string): string {
    return sign({ id: userId, email }, this.config.JWT_SECRET, {
      expiresIn: '1h',
    });
  }
}
