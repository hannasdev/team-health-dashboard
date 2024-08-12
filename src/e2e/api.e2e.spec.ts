// e2e/api.e2e.spec.ts
import request from 'supertest';
import EventSource from 'eventsource';

const apiEndpoint = 'http://app:3000';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const retryRequest = async (
  method: 'get' | 'post',
  url: string,
  body?: any,
  maxRetries = 5,
  delay = 1000,
): Promise<request.Response> => {
  let lastError: unknown;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const req = request(apiEndpoint)[method](url);
      if (body) req.send(body);
      return await req;
    } catch (error: unknown) {
      lastError = error;
      if (i === maxRetries - 1) break;
      await wait(delay);
    }
  }

  if (lastError instanceof Error) {
    throw new Error(`Max retries reached: ${lastError.message}`);
  } else {
    throw new Error('Max retries reached: Unknown error');
  }
};

describe('API E2E Tests', () => {
  describe('GET /api/metrics', () => {
    let authToken: string;

    beforeAll(async () => {
      // Register a user
      await retryRequest('post', '/api/auth/register', {
        email: 'testuser@example.com',
        password: 'testpassword',
      });

      // Login to get the token
      const loginResponse = await retryRequest('post', '/api/auth/login', {
        email: 'testuser@example.com',
        password: 'testpassword',
      });

      authToken = loginResponse.body.token;
    });

    afterAll(async () => {
      // Add a method to your auth service to remove test users
      await request(apiEndpoint)
        .post('/api/auth/cleanup')
        .send({ email: 'testuser@example.com' });
    });

    it('should stream metrics data with progress and result events', done => {
      const timePeriod = 7;
      const es = new EventSource(
        `${apiEndpoint}/api/metrics?timePeriod=${timePeriod}`,
        { headers: { Authorization: `Bearer ${authToken}` } },
      );

      const events: any[] = [];
      let progressReceived = false;
      let resultReceived = false;

      const checkCompletion = () => {
        if (progressReceived && resultReceived) {
          es.close();
          done();
        }
      };

      es.onmessage = (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        events.push(data);
        if (data.progress !== undefined) {
          progressReceived = true;
        }
        checkCompletion();
      };

      es.onerror = (err: Event) => {
        es.close();
        done(err);
      };

      es.addEventListener('result', (event: MessageEvent) => {
        const resultData = JSON.parse(event.data);
        expect(resultData.success).toBe(true);
        expect(Array.isArray(resultData.data)).toBe(true);
        expect(resultData.githubStats.timePeriod).toBe(timePeriod);
        resultReceived = true;
        checkCompletion();
      });
    }, 120000);

    it('should handle errors gracefully', done => {
      const es = new EventSource(`${apiEndpoint}/api/metrics?error=true`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      es.onerror = (err: Event) => {
        es.close();
        // Check if the error is due to an unauthorized request
        if (err instanceof MessageEvent && err.data) {
          const errorData = JSON.parse(err.data);
          expect(errorData.message).toBe('Unauthorized');
          expect(errorData.status).toBe(401);
          done();
        } else {
          done(err);
        }
      };

      es.addEventListener('error', (event: MessageEvent) => {
        es.close();
        const errorData = JSON.parse(event.data);
        expect(errorData.success).toBe(false);
        expect(errorData.errors).toBeDefined();
        done();
      });
    }, 60000);
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const uniqueEmail = `testuser_${Date.now()}@example.com`;
      const response = await retryRequest('post', '/api/auth/register', {
        email: uniqueEmail,
        password: 'testpassword',
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
    });

    it('should handle existing user registration', async () => {
      const response = await request(apiEndpoint)
        .post('/api/auth/register')
        .send({
          email: 'testuser@example.com',
          password: 'testpassword',
        })
        .expect(400)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('message', 'User already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should log in a registered user', async () => {
      const response = await request(apiEndpoint)
        .post('/api/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'testpassword',
        })
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('token');
    });

    it('should handle invalid login credentials', async () => {
      const response = await request(apiEndpoint)
        .post('/api/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'wrongpassword',
        })
        .expect(401)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });
  });

  // ... more tests for other endpoints ...
});
