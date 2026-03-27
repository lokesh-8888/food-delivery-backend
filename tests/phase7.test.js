const request = require('supertest');
const app = require('../src/app');
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Restaurant = require('../src/models/Restaurant');
const fs = require('fs');
const path = require('path');

describe('Phase 7 Tests', () => {
  let server;

  beforeAll(async () => {
    // Start server for testing
    server = app.listen(0);
    
    // Connect to test database
    const mongoUri = process.env.MONGO_URI + '_test';
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    // Clean up
    if (server) {
      server.close();
    }
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clean database before each test
    await User.deleteMany({});
    await Restaurant.deleteMany({});
  });

  describe('Test 1 — Server starts cleanly', () => {
    it('should start server without errors', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Test 2 — Log files created', () => {
    it('should create log files', () => {
      const logsDir = path.join(__dirname, '../logs');
      const combinedLog = path.join(logsDir, 'combined.log');
      const errorLog = path.join(logsDir, 'error.log');
      
      expect(fs.existsSync(combinedLog)).toBe(true);
      expect(fs.existsSync(errorLog)).toBe(true);
    });
  });

  describe('Test 3 — Text search works', () => {
    beforeEach(async () => {
      // Create test restaurants
      await Restaurant.create({
        name: 'Chicken Palace',
        cuisine: 'Chinese',
        isApproved: true,
        isOpen: true,
        menu: [
          { name: 'Chicken Fried Rice', isAvailable: true, price: 120 },
          { name: 'Beef Noodles', isAvailable: true, price: 150 }
        ]
      });
    });

    it('should return restaurants matching search term', async () => {
      const response = await request(app)
        .get('/api/v1/user/restaurants?search=chicken')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.restaurants).toHaveLength(1);
      expect(response.body.data.restaurants[0].name).toBe('Chicken Palace');
    });
  });

  describe('Test 4 — Rate limiting works', () => {
    it('should rate limit after 100 requests', async () => {
      const promises = [];
      
      // Make 101 requests rapidly
      for (let i = 0; i < 101; i++) {
        promises.push(request(app).get('/api/v1/user/restaurants'));
      }

      const responses = await Promise.all(promises);
      
      // Check that at least one request was rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
      
      // Check rate limit response format
      const rateLimitResponse = rateLimitedResponses[0];
      expect(rateLimitResponse.body.success).toBe(false);
      expect(rateLimitResponse.body.message).toContain('Too many requests');
    }, 30000); // 30 second timeout
  });

  describe('Test 5 — Sanitization works', () => {
    it('should reject malicious input in auth login', async () => {
      const maliciousPayload = {
        email: { "$gt": "" }, // Attempt NoSQL injection
        password: "123456"
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(maliciousPayload)
        .expect(400);

      expect(response.body.success).toBe(false);
      // Should be caught by validation, not reach DB
      expect(response.body.message).toContain('Validation failed');
    });
  });

  describe('Test 6 — Error logging works', () => {
    it('should log errors to combined log', async () => {
      const logsDir = path.join(__dirname, '../logs');
      const combinedLog = path.join(logsDir, 'combined.log');
      
      // Clear existing log content
      if (fs.existsSync(combinedLog)) {
        fs.writeFileSync(combinedLog, '');
      }

      // Make a request to non-existent route
      await request(app).get('/api/v1/nonexistent');

      // Give some time for async logging
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check that error was logged
      const logContent = fs.readFileSync(combinedLog, 'utf8');
      expect(logContent).toContain('GET /api/v1/nonexistent');
      expect(logContent).toContain('404');
    });
  });
});
