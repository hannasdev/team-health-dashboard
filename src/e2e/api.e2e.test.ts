// test/e2e/api.e2e.test.ts
import { Server } from 'http';

import { MongoClient } from 'mongodb';
import request from 'supertest';

import app from '@/app';

let server: Server;
let mongoClient: MongoClient;

beforeAll(async () => {
  mongoClient = new MongoClient(
    process.env.DATABASE_URL || 'mongodb://localhost:27018/myapp_test',
  );
  await mongoClient.connect();
  server = app.listen(0);
});

afterAll(async () => {
  await mongoClient.close();
  await new Promise<void>(resolve => server.close(() => resolve()));
});

describe('API E2E Tests', () => {
  describe('GET /', () => {
    it('should return welcome message', async () => {
      const response = await request(server).get('/');
      expect(response.status).toBe(200);
      expect(response.text).toBe('Team Health Dashboard API');
    });
  });

  describe('GET /api/metrics', () => {
    it('should return metrics data', async () => {
      const response = await request(server)
        .get('/api/metrics')
        .expect('Content-Type', /text\/event-stream/)
        .expect(200);

      // Parse the SSE response
      const events = response.text.split('\n\n').filter(Boolean);
      const resultEvent = events.find(event =>
        event.startsWith('event: result'),
      );

      expect(resultEvent).toBeDefined();

      const resultData = JSON.parse(
        resultEvent!.split('\n')[1].replace('data: ', ''),
      );
      expect(resultData.success).toBe(true);
      expect(Array.isArray(resultData.data)).toBe(true);
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(server)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('token');
    });

    it('should return 400 if user already exists', async () => {
      // First, register a user
      await request(server).post('/api/auth/register').send({
        email: 'existing@example.com',
        password: 'password123',
      });

      // Try to register the same user again
      const response = await request(server)
        .post('/api/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'password123',
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'User already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login an existing user', async () => {
      // First, register a user
      await request(server).post('/api/auth/register').send({
        email: 'login@example.com',
        password: 'password123',
      });

      // Now, try to login
      const response = await request(server)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123',
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('token');
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(server)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });
  });
});
