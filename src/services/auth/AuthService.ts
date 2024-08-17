// src/services/AuthService.ts
import { inject, injectable } from 'inversify';

import {
  IAuthService,
  IConfig,
  IJwtService,
  IBcryptService,
  IUserRepository,
  ILogger,
} from '../../interfaces/index.js';
import { User } from '../../models/User.js';
import { TYPES } from '../../utils/types.js';

@injectable()
export class AuthService implements IAuthService {
  constructor(
    @inject(TYPES.Config) private config: IConfig,
    @inject(TYPES.JwtService) private jwtService: IJwtService,
    @inject(TYPES.BcryptService) private bcryptService: IBcryptService,
    @inject(TYPES.UserRepository) private userRepository: IUserRepository,
    @inject(TYPES.Logger) private logger: ILogger,
  ) {}

  public validateToken(token: string): { id: string; email: string } {
    return this.jwtService.verify(token, this.config.JWT_SECRET) as {
      id: string;
      email: string;
    };
  }

  public generateToken(payload: { id: string; email: string }): string {
    return this.jwtService.sign(payload, this.config.JWT_SECRET, {
      expiresIn: '1d',
    });
  }

  public async login(email: string, password: string): Promise<string> {
    const user = await this.userRepository.findByEmail(email);
    if (!user || !(await this.bcryptService.compare(password, user.password))) {
      this.logger.warn(`Failed login attempt for email: ${email}`);
      throw new Error('Invalid credentials');
    }
    this.logger.info(`Successful login for user: ${email}`);
    return this.generateToken({ id: user.id, email: user.email });
  }

  public async register(email: string, password: string): Promise<string> {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      this.logger.warn(`Registration attempt with existing email: ${email}`);
      throw new Error('User already exists');
    }
    const hashedPassword = await this.bcryptService.hash(password, 10);
    const newUser = await this.userRepository.create(email, hashedPassword);
    this.logger.info(`New user registered: ${email}`);
    return this.generateToken({ id: newUser.id, email: newUser.email });
  }

  public async refreshToken(token: string): Promise<string> {
    const decoded = this.validateToken(token);
    this.logger.info(`Token refreshed for user: ${decoded.email}`);
    return this.generateToken({ id: decoded.id, email: decoded.email });
  }

  // We'll need to implement a token blacklist for proper revocation
  private tokenBlacklist: Set<string> = new Set();

  public async revokeToken(token: string): Promise<void> {
    this.tokenBlacklist.add(token);
    this.logger.info(`Token revoked: ${token.substring(0, 10)}...`);
  }

  public async isTokenRevoked(token: string): Promise<boolean> {
    return this.tokenBlacklist.has(token);
  }

  // These methods would typically involve sending emails and managing reset tokens
  // For now, we'll leave them as placeholder implementations
  public async initiatePasswordReset(email: string): Promise<void> {
    // TODO: Implement password reset initiation logic
    this.logger.info(`Password reset initiated for ${email}`);
  }

  public async resetPassword(
    resetToken: string,
    newPassword: string,
  ): Promise<void> {
    // TODO: Implement password reset logic
    this.logger.info(
      `Password reset with token ${resetToken.substring(0, 10)}...`,
    );
  }
}
