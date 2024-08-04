import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { config } from '@/config/config';
import { User } from '@/models/User';
import { UserRepository } from '@/repositories/user/UserRepository';

describe('UserRepository Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  let mongoClient: MongoClient;
  let userRepository: UserRepository;

  beforeAll(async () => {
    // Start the in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Connect to the in-memory database
    mongoClient = await MongoClient.connect(mongoUri);

    // Update the config to use the in-memory database URL
    config.DATABASE_URL = mongoUri;

    // Initialize the UserRepository
    userRepository = new UserRepository();
  });

  afterAll(async () => {
    // Close the MongoDB connection and stop the in-memory server
    await mongoClient.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear the users collection before each test
    const db = mongoClient.db();
    await db.collection('users').deleteMany({});
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      const user = await userRepository.create(email, password);

      expect(user).toBeInstanceOf(User);
      expect(user.email).toBe(email);
      expect(user.password).toBe(password); // Note: In a real scenario, we'd expect the password to be hashed
    });
  });

  describe('findByEmail', () => {
    it('should find a user by email', async () => {
      const email = 'find@example.com';
      const password = 'findpassword';

      await userRepository.create(email, password);

      const foundUser = await userRepository.findByEmail(email);

      expect(foundUser).toBeDefined();
      expect(foundUser?.email).toBe(email);
    });

    it('should return undefined for non-existent user', async () => {
      const nonExistentUser = await userRepository.findByEmail(
        'nonexistent@example.com',
      );

      expect(nonExistentUser).toBeUndefined();
    });
  });
});
