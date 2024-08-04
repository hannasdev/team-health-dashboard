// src/controllers/AuthController.ts
import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import jwt from 'jsonwebtoken';

import { config } from '../config/config';
import { UserRepository } from '../repositories/user/UserRepository';
import { TYPES } from '../utils/types';

@injectable()
export class AuthController {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: UserRepository,
  ) {}

  public async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;
    try {
      const user = await this.userRepository.findByEmail(email);
      if (!user || !(await bcrypt.compare(password, user.password))) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }
      const token = jwt.sign(
        { id: user.id, email: user.email },
        config.JWT_SECRET,
        { expiresIn: '1h' },
      );
      res.json({ token });
    } catch (error) {
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
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await this.userRepository.create(email, hashedPassword);
      const token = jwt.sign(
        { id: user.id, email: user.email },
        config.JWT_SECRET,
        { expiresIn: '1h' },
      );
      res.status(201).json({ token });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
