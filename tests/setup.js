const mongoose = require('mongoose');

// Global test setup
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  
  // Connect to test database
  const mongoUri = process.env.MONGO_URI + '_test';
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  // Clean up test database
  await mongoose.connection.close();
});

// Silence console logs during tests
if (process.env.NODE_ENV === 'test') {
  console.log = jest.fn();
  console.error = jest.fn();
}
