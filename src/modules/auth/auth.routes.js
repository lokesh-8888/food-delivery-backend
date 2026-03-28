const express = require("express");
const rateLimit = require("express-rate-limit");
const { register, login, logout, getMe } = require("./auth.controller");
const { validateRegister, validateLogin } = require("./auth.validator");
const { verifyToken } = require("../../middlewares/auth.middleware");

const router = express.Router();

// Create rate limiter: max 10 requests per 15 minutes per IP, message: "Too many requests, please try again later"
const rateLimiter = rateLimit({
  max: 10,
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: "Too many requests, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /register → rateLimiter, validateRegister, register
router.post("/register", rateLimiter, validateRegister, register);

// POST /login → rateLimiter, validateLogin, login
router.post("/login", rateLimiter, validateLogin, login);

// POST /logout → logout
router.post("/logout", logout);

// GET /me → verifyToken, getMe
router.get("/me", verifyToken, getMe);

module.exports = router;
