require("dotenv").config();

// Initialize Sentry at very top of server.js before everything
const Sentry = require("@sentry/node");
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0
});

const connectDB = require("./src/config/db");
const app = require("./src/app");
const http = require("http");

const mongoose = require("mongoose");
const { initSocket } = require("./src/socket/socket");
const { startJobs } = require("./src/jobs/jobs");
const { createIndexes } = require("./src/config/indexes");

// Connect to database
connectDB();

// Create MongoDB text indexes
createIndexes().catch(err => {
  console.error("Failed to create indexes:", err);
});

const PORT = process.env.PORT || 5000;

// Create HTTP server from Express app
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Start background jobs
startJobs();

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode 🚀`);
});

// Handle process termination gracefully
process.on("SIGTERM", () => {
  console.log("SIGTERM received — shutting down gracefully");
  server.close(() => {
    console.log("Server closed");
    mongoose.connection.close();
    process.exit(0);
  });
});

process.on("uncaughtException", (err) => {
  console.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});