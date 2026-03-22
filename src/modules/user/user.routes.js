const express = require("express");
const { verifyToken } = require("../../middlewares/auth.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");
const {
  getProfile,
  updateProfile,
  getRestaurants,
  getRestaurantMenu,
  placeOrder,
  getOrderHistory,
  trackOrder,
  cancelOrder,
  submitReview
} = require("./user.controller");

const router = express.Router();

// All routes protected with verifyToken + authorizeRoles("user")

// GET    /profile                    → verifyToken, authorizeRoles("user"), getProfile
router.get("/profile", verifyToken, authorizeRoles("user"), getProfile);

// PUT    /profile                    → verifyToken, authorizeRoles("user"), updateProfile
router.put("/profile", verifyToken, authorizeRoles("user"), updateProfile);

// GET    /restaurants                → verifyToken, authorizeRoles("user"), getRestaurants
router.get("/restaurants", verifyToken, authorizeRoles("user"), getRestaurants);

// GET    /restaurants/:id/menu       → verifyToken, authorizeRoles("user"), getRestaurantMenu
router.get("/restaurants/:id/menu", verifyToken, authorizeRoles("user"), getRestaurantMenu);

// POST   /orders                     → verifyToken, authorizeRoles("user"), placeOrder
router.post("/orders", verifyToken, authorizeRoles("user"), placeOrder);

// GET    /orders                     → verifyToken, authorizeRoles("user"), getOrderHistory
router.get("/orders", verifyToken, authorizeRoles("user"), getOrderHistory);

// GET    /orders/:id                 → verifyToken, authorizeRoles("user"), trackOrder
router.get("/orders/:id", verifyToken, authorizeRoles("user"), trackOrder);

// PUT    /orders/:id/cancel          → verifyToken, authorizeRoles("user"), cancelOrder
router.put("/orders/:id/cancel", verifyToken, authorizeRoles("user"), cancelOrder);

// POST   /reviews                    → verifyToken, authorizeRoles("user"), submitReview
router.post("/reviews", verifyToken, authorizeRoles("user"), submitReview);

module.exports = router;
