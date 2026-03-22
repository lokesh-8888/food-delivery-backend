const express = require("express");
const { verifyToken } = require("../../middlewares/auth.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");
const {
  createRestaurant,
  updateRestaurant,
  toggleStatus,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getRestaurantOrders,
  updateOrderStatus
} = require("./restaurant.controller");

const router = express.Router();

// All routes protected with verifyToken + authorizeRoles("restaurant_owner")

// POST   /                           → verifyToken, authorizeRoles("restaurant_owner"), createRestaurant
router.post("/", verifyToken, authorizeRoles("restaurant_owner"), createRestaurant);

// PUT    /                           → verifyToken, authorizeRoles("restaurant_owner"), updateRestaurant
router.put("/", verifyToken, authorizeRoles("restaurant_owner"), updateRestaurant);

// PUT    /toggle-status              → verifyToken, authorizeRoles("restaurant_owner"), toggleStatus
router.put("/toggle-status", verifyToken, authorizeRoles("restaurant_owner"), toggleStatus);

// POST   /menu                       → verifyToken, authorizeRoles("restaurant_owner"), addMenuItem
router.post("/menu", verifyToken, authorizeRoles("restaurant_owner"), addMenuItem);

// PUT    /menu/:itemId               → verifyToken, authorizeRoles("restaurant_owner"), updateMenuItem
router.put("/menu/:itemId", verifyToken, authorizeRoles("restaurant_owner"), updateMenuItem);

// DELETE /menu/:itemId               → verifyToken, authorizeRoles("restaurant_owner"), deleteMenuItem
router.delete("/menu/:itemId", verifyToken, authorizeRoles("restaurant_owner"), deleteMenuItem);

// GET    /orders                     → verifyToken, authorizeRoles("restaurant_owner"), getRestaurantOrders
router.get("/orders", verifyToken, authorizeRoles("restaurant_owner"), getRestaurantOrders);

// PUT    /orders/:id/status          → verifyToken, authorizeRoles("restaurant_owner"), updateOrderStatus
router.put("/orders/:id/status", verifyToken, authorizeRoles("restaurant_owner"), updateOrderStatus);

module.exports = router;
