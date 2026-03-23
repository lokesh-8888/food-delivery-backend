const express = require("express");
const { verifyToken } = require("../../middlewares/auth.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");
const {
  getAllUsers,
  toggleUserStatus,
  getAllRestaurants,
  approveRestaurant,
  getAllOrders,
  getAllDeliveryAgents,
  getDashboardStats
} = require("./admin.controller");

const router = express.Router();

// All routes protected with verifyToken + authorizeRoles("admin")

// GET  /users                    → verifyToken, authorizeRoles("admin"), getAllUsers
router.get("/users", verifyToken, authorizeRoles("admin"), getAllUsers);

// PUT  /users/:id/status         → verifyToken, authorizeRoles("admin"), toggleUserStatus
router.put("/users/:id/status", verifyToken, authorizeRoles("admin"), toggleUserStatus);

// GET  /restaurants              → verifyToken, authorizeRoles("admin"), getAllRestaurants
router.get("/restaurants", verifyToken, authorizeRoles("admin"), getAllRestaurants);

// PUT  /restaurants/:id/approve  → verifyToken, authorizeRoles("admin"), approveRestaurant
router.put("/restaurants/:id/approve", verifyToken, authorizeRoles("admin"), approveRestaurant);

// GET  /orders                   → verifyToken, authorizeRoles("admin"), getAllOrders
router.get("/orders", verifyToken, authorizeRoles("admin"), getAllOrders);

// GET  /delivery-agents          → verifyToken, authorizeRoles("admin"), getAllDeliveryAgents
router.get("/delivery-agents", verifyToken, authorizeRoles("admin"), getAllDeliveryAgents);

// GET  /stats                    → verifyToken, authorizeRoles("admin"), getDashboardStats
router.get("/stats", verifyToken, authorizeRoles("admin"), getDashboardStats);

module.exports = router;
