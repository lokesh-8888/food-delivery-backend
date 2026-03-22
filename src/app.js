const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");

// Import routes
const authRoutes = require("./modules/auth/auth.routes");
const userRoutes = require("./modules/user/user.routes");
const restaurantRoutes = require("./modules/restaurant/restaurant.routes");
const deliveryRoutes = require("./modules/delivery/delivery.routes");
const paymentRoutes = require("./modules/payment/payment.routes");
const adminRoutes = require("./modules/admin/admin.routes");

const app = express();

// Apply middlewares in exact order
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());

// Mount all routes under /api/v1/
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/restaurant", restaurantRoutes);
app.use("/api/v1/delivery", deliveryRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/admin", adminRoutes);

// Base route
app.get("/", (req, res) => {
  res.json({ success: true, message: "Food Delivery API is running 🚀" });
});

// Global error handler
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV === "development") {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      stack: err.stack,
    });
  }
  
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message,
  });
});

module.exports = app;
