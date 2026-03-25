require("dotenv").config();
const connectDB = require("./src/config/db");
const app = require("./src/app");
const http = require("http");
const { initSocket } = require("./src/socket/socket");
const { startJobs } = require("./src/jobs/jobs");

// Connect to database
connectDB();

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