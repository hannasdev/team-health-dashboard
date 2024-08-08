import { Server } from 'http';

import request from 'supertest';

import app from '@/index';

let server: Server;

beforeAll(done => {
  server = app.listen(done);
});

afterAll(done => {
  server.close(done);
});

describe('GET /api/metrics', () => {
  it('should return metrics data', async () => {
    const response = await request(server)
      .get('/api/metrics')
      .expect('Content-Type', /text\/event-stream/)
      .expect(200);

    // Parse the SSE response
    const events = response.text.split('\n\n').filter(Boolean);
    const resultEvent = events.find(event => event.startsWith('event: result'));

    expect(resultEvent).toBeDefined();

    const resultData = JSON.parse(
      resultEvent!.split('\n')[1].replace('data: ', ''),
    );
    expect(resultData.success).toBe(true);
    expect(Array.isArray(resultData.data)).toBe(true);
    // Add more specific assertions based on your expected data structure
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
