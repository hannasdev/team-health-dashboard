// e2e/api.e2e.test.ts
import request from 'supertest';

const apiEndpoint = 'http://app:3000';

describe('API E2E Tests', () => {
  describe('GET /api/metrics', () => {
    it('should stream metrics data with progress and result events', done => {
      const timePeriod = 7; // Test with a specific time period
      request(apiEndpoint)
        .get(`/api/metrics?timePeriod=${timePeriod}`)
        .set('Accept', 'text/event-stream')
        .expect('Content-Type', /text\/event-stream/)
        .end((err, res) => {
          if (err) return done(err);

          // Parse the SSE response
          const events = res.text.split('\n\n').filter(Boolean);

          // Expect progress events
          expect(
            events.some(event => event.startsWith('event: progress')),
          ).toBe(true);

          // Expect a result event
          const resultEvent = events.find(event =>
            event.startsWith('event: result'),
          );
          expect(resultEvent).toBeDefined();

          // Validate result event data
          const resultData = JSON.parse(
            resultEvent!.split('\n')[1].replace('data: ', ''),
          );
          expect(resultData.success).toBe(true);
          expect(Array.isArray(resultData.data)).toBe(true);
          expect(resultData.githubStats.timePeriod).toBe(timePeriod); // Check timePeriod

          done();
        });
    });

    it('should handle errors gracefully', done => {
      // ... (Simulate an error scenario, e.g., by providing invalid input)
      // ... Then assert for an "error" event in the response
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(apiEndpoint)
        .post('/api/auth/register')
        .send({
          email: 'testuser@example.com',
          password: 'testpassword',
        })
        .expect(201)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('token');
    });

    it('should handle existing user registration', async () => {
      const response = await request(apiEndpoint)
        .post('/api/auth/register')
        .send({
          email: 'testuser@example.com', // Try to register the same user again
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
