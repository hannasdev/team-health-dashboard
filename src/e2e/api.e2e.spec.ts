// e2e/api.e2e.spec.ts
import EventSource from 'eventsource';
import request from 'supertest';

const apiEndpoint = process.env.API_URL || 'http://localhost:3000';

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
  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    // Register a user
    await retryRequest('post', '/api/auth/register', {
      email: 'testuser@example.com',
      password: 'testpassword',
    });

    // Login to get the tokens
    const loginResponse = await retryRequest('post', '/api/auth/login', {
      email: 'testuser@example.com',
      password: 'testpassword',
    });

    accessToken = loginResponse.body.accessToken;
    refreshToken = loginResponse.body.refreshToken;
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(apiEndpoint)
        .get('/health')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('status');
    });
  });

  describe('GET /api/metrics', () => {
    it('should deny access for unauthenticated users', async () => {
      const response = await request(apiEndpoint)
        .get('/api/metrics')
        .expect(401)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('message', 'No token provided');
    });

    it('should allow access for authenticated users and stream data', done => {
      const timePeriod = 7;
      const es = new EventSource(
        `${apiEndpoint}/api/metrics?timePeriod=${timePeriod}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

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
        if (data.progress !== undefined) {
          progressReceived = true;
        }
        if (data.success && Array.isArray(data.data)) {
          resultReceived = true;
        }
        checkCompletion();
      };

      es.onerror = (err: Event) => {
        es.close();
        done(err);
      };

      // Add a timeout to close the connection if we don't receive a result
      setTimeout(() => {
        if (!resultReceived) {
          es.close();
          done(new Error('Test timed out without receiving a result'));
        }
      }, 30000); // Adjust timeout as needed
    });
  });

  describe('GET /api/metrics with token handling', () => {
    it('should handle token expiration and refresh during metrics retrieval', done => {
      const timePeriod = 7;
      let tokenRefreshed = false;

      const es = new EventSource(
        `${apiEndpoint}/api/metrics?timePeriod=${timePeriod}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      es.onmessage = async (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        if (data.error === 'Access token expired' && !tokenRefreshed) {
          tokenRefreshed = true;
          es.close();

          // Refresh the token
          const refreshResponse = await request(apiEndpoint)
            .post('/api/auth/refresh')
            .send({ refreshToken });

          accessToken = refreshResponse.body.accessToken;
          refreshToken = refreshResponse.body.refreshToken;

          // Restart the EventSource with the new token
          const newEs = new EventSource(
            `${apiEndpoint}/api/metrics?timePeriod=${timePeriod}`,
            { headers: { Authorization: `Bearer ${accessToken}` } },
          );

          newEs.onmessage = (newEvent: MessageEvent) => {
            const newData = JSON.parse(newEvent.data);
            if (newData.success) {
              newEs.close();
              done();
            }
          };

          newEs.onerror = err => {
            newEs.close();
            done(err);
          };
        } else if (data.success) {
          es.close();
          done();
        }
      };

      es.onerror = err => {
        es.close();
        done(err);
      };
    }, 120000);
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const uniqueEmail = `testuser_${Date.now()}@example.com`;
      const response = await retryRequest('post', '/api/auth/register', {
        email: uniqueEmail,
        password: 'testpassword',
      });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('user');
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

      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('user');
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

  describe('POST /api/auth/refresh', () => {
    it('should refresh the access token with a valid refresh token', async () => {
      const loginResponse = await request(apiEndpoint)
        .post('/api/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'testpassword',
        });

      const validRefreshToken = loginResponse.body.refreshToken;

      const response = await request(apiEndpoint)
        .post('/api/auth/refresh')
        .send({ refreshToken: validRefreshToken })
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should reject an invalid refresh token', async () => {
      const response = await request(apiEndpoint)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-refresh-token' })
        .expect(401)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('message', 'Invalid refresh token');
    });
  });

  describe('Access token usage', () => {
    it('should access a protected route with the new access token', async () => {
      const response = await request(apiEndpoint)
        .get('/api/metrics')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Check for the start of the event stream
      expect(response.headers['content-type']).toMatch(/^text\/event-stream/);
    });

    it('should reject an expired access token', async () => {
      // Wait for the access token to expire (you may need to adjust the wait time)
      await wait(5000); // Assuming a short expiration time for testing purposes

      const response = await request(apiEndpoint)
        .get('/api/metrics')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('message', 'Token has expired');
    });
  });
});
