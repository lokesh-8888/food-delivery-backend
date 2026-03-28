const mongoose = require('mongoose');

// Global test setup
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  
  // Use a test database name instead of appending _test to the entire URI
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/foodDB_test';
  
  // Connect to test database
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
