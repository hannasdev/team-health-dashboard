// src/controllers/AuthController.ts
import { Request, Response, NextFunction } from 'express';
import { inject, injectable } from 'inversify';

import { TYPES } from '../utils/types.js';

import type {
  IConfig,
  ILogger,
  IUserRepository,
  IAuthController,
  IBcryptService,
  IJwtService,
} from '../interfaces/index.js';

@injectable()
export class AuthController implements IAuthController {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: IUserRepository,
    @inject(TYPES.Config) private config: IConfig,
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.BcryptService) private bcryptService: IBcryptService,
    @inject(TYPES.JwtService) private jwtService: IJwtService,
  ) {}

  public async login(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const { email, password } = req.body;
    try {
      const user = await this.userRepository.findByEmail(email);
      if (
        !user ||
        !(await this.bcryptService.compare(password, user.password))
      ) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }
      const { accessToken, refreshToken } = this.generateTokens(
        user.id,
        user.email,
      );
      res.json({
        user: { id: user.id, email: user.email },
        accessToken,
        refreshToken,
      });
    } catch (error) {
      this.logger.error('Error in login:', error as Error);
      next(error);
    }
  }

  public async register(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const { email, password } = req.body;
    try {
      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser) {
        res.status(400).json({ message: 'User already exists' });
        return;
      }
      const hashedPassword = await this.bcryptService.hash(password, 10);
      const user = await this.userRepository.create(email, hashedPassword);
      const { accessToken, refreshToken } = this.generateTokens(
        user.id,
        user.email,
      );

      res.status(201).json({
        user: { id: user.id, email: user.email },
        accessToken,
        refreshToken,
      });
    } catch (error) {
      this.logger.error('Error in register:', error as Error);
      next(error);
    }
  }

  public async refreshToken(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const { refreshToken } = req.body;
    try {
      const decoded = this.jwtService.verify(
        refreshToken,
        this.config.REFRESH_TOKEN_SECRET,
      ) as { id: string; email: string };

      if (typeof decoded !== 'object' || !decoded.id) {
        res.status(401).json({ message: 'Invalid refresh token' });
        return;
      }

      const user = await this.userRepository.findById(decoded.id);
      if (!user) {
        res.status(401).json({ message: 'Invalid refresh token' });
        return;
      }
      const { accessToken, refreshToken: newRefreshToken } =
        this.generateTokens(user.id, user.email);
      res.json({
        user: { id: user.id, email: user.email },
        accessToken,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      this.logger.error('Error in refreshToken:', error as Error);
      next(error);
    }
  }

  private generateTokens(
    userId: string,
    email: string,
  ): { accessToken: string; refreshToken: string } {
    const accessToken = this.jwtService.sign(
      { id: userId, email },
      this.config.JWT_SECRET,
      { expiresIn: '15m' },
    );
    const refreshToken = this.jwtService.sign(
      { id: userId },
      this.config.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' },
    );
    return { accessToken, refreshToken };
  }
}
