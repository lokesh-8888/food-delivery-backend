const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");


// Import routes
const authRoutes = require("./modules/auth/auth.routes");
const userRoutes = require("./modules/user/user.routes");
const restaurantRoutes = require("./modules/restaurant/restaurant.routes");
const deliveryRoutes = require("./modules/delivery/delivery.routes");
const paymentRoutes = require("./modules/payment/payment.routes");
const adminRoutes = require("./modules/admin/admin.routes");

const app = express();
// Base route
app.get("/", (req, res) => {
  res.json({ success: true, message: "Food Delivery API is running 🚀" });
});


// Apply middlewares in exact order
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(morgan("dev"));

// Webhook route needs raw body not parsed JSON - BEFORE express.json()
app.use("/api/v1/payment/webhook", express.raw({ type: "application/json" }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


// Mount all routes under /api/v1/
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/restaurant", restaurantRoutes);
app.use("/api/v1/delivery", deliveryRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/admin", adminRoutes);


// Global error handler
app.use((err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // If instance of ApiError → use err.statusCode and err.message
  if (err.statusCode) {
    error.statusCode = err.statusCode;
  }
  
  // Mongoose ValidationError → 400 with field messages
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = {
      statusCode: 400,
      message: message.join(', '),
      success: false
    };
  }
  
  // Mongoose CastError (invalid ObjectId) → 400 "Invalid ID format"
  if (err.name === 'CastError') {
    error = {
      statusCode: 400,
      message: 'Invalid ID format',
      success: false
    };
  }
  
  // Duplicate key error (code 11000) → 409 "Already exists"
  if (err.code === 11000) {
    error = {
      statusCode: 409,
      message: 'Already exists',
      success: false
    };
  }
  
  // JWT JsonWebTokenError → 401 "Invalid token"
  if (err.name === 'JsonWebTokenError') {
    error = {
      statusCode: 401,
      message: 'Invalid token',
      success: false
    };
  }
  
  // JWT TokenExpiredError → 401 "Token expired"
  if (err.name === 'TokenExpiredError') {
    error = {
      statusCode: 401,
      message: 'Token expired',
      success: false
    };
  }
  
  // Default fallback → 500 "Internal server error"
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';
  
  if (process.env.NODE_ENV === "development") {
    // Development mode → include stack in response
    return res.status(statusCode).json({
      success: false,
      message: message,
      stack: err.stack,
    });
  }
  
  // Production → message only
  res.status(statusCode).json({
    success: false,
    message: message,
  });
});

module.exports = app;
