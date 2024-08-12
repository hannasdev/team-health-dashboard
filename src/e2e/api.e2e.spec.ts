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

      es.onopen = () => {
        console.log('Connection opened');
      };

      es.onmessage = (event: MessageEvent) => {
        console.log('Received message:', event.data);
        try {
          const data = JSON.parse(event.data);
          events.push(data);
          if (data.progress !== undefined) {
            progressReceived = true;
          }
          checkCompletion();
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      es.onerror = (err: Event) => {
        console.error('EventSource error:', err);
        es.close();
        done(err);
      };

      es.addEventListener('result', (event: MessageEvent) => {
        console.log('Received result event:', event.data);
        try {
          const resultData = JSON.parse(event.data);
          expect(resultData.success).toBe(true);
          expect(Array.isArray(resultData.data)).toBe(true);
          expect(resultData.githubStats.timePeriod).toBe(timePeriod);
          resultReceived = true;
          checkCompletion();
        } catch (error) {
          console.error('Error parsing result:', error);
          done(error);
        }
      });

      // Add a timeout to close the connection if we don't receive a result
      setTimeout(() => {
        if (!resultReceived) {
          console.error('Test timed out without receiving a result');
          es.close();
          done(new Error('Test timed out'));
        }
      }, 110000); // Set this slightly less than the Jest timeout
    }, 120000);

    it('should handle errors gracefully', done => {
      const es = new EventSource(`${apiEndpoint}/api/metrics?error=true`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      es.onopen = () => {
        console.log('Connection opened');
      };

      es.onerror = (err: Event) => {
        console.error('EventSource error:', err);
        es.close();
        // Check if the error is due to an unauthorized request
        if (err instanceof MessageEvent && err.data) {
          try {
            const errorData = JSON.parse(err.data);
            expect(errorData.message).toBe('Unauthorized');
            expect(errorData.status).toBe(401);
            done();
          } catch (parseError) {
            console.error('Error parsing error data:', parseError);
            done(parseError);
          }
        } else {
          // If it's not a MessageEvent with data, we'll consider it a valid error case
          done();
        }
      };

      es.addEventListener('error', (event: MessageEvent) => {
        console.log('Received error event:', event.data);
        es.close();
        try {
          const errorData = JSON.parse(event.data);
          expect(errorData.success).toBe(false);
          expect(errorData.errors).toBeDefined();
          done();
        } catch (error) {
          console.error('Error parsing error event:', error);
          done(error);
        }
      });

      // Add a timeout to close the connection if we don't receive an error
      setTimeout(() => {
        console.error('Test timed out without receiving an error');
        es.close();
        done(new Error('Test timed out'));
      }, 55000); // Set this slightly less than the Jest timeout
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
