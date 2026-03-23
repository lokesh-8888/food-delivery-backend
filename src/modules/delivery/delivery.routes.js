const express = require("express");
const { verifyToken } = require("../../middlewares/auth.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");
const {
  getProfile,
  toggleAvailability,
  getAssignedOrders,
  updateOrderStatus,
  updateLocation
} = require("./delivery.controller");

const router = express.Router();

// All routes protected with verifyToken + authorizeRoles("delivery_agent")

// GET  /profile              → verifyToken, authorizeRoles("delivery_agent"), getProfile
router.get("/profile", verifyToken, authorizeRoles("delivery_agent"), getProfile);

// PUT  /toggle-availability  → verifyToken, authorizeRoles("delivery_agent"), toggleAvailability
router.put("/toggle-availability", verifyToken, authorizeRoles("delivery_agent"), toggleAvailability);

// GET  /orders               → verifyToken, authorizeRoles("delivery_agent"), getAssignedOrders
router.get("/orders", verifyToken, authorizeRoles("delivery_agent"), getAssignedOrders);

// PUT  /orders/:id/status    → verifyToken, authorizeRoles("delivery_agent"), updateOrderStatus
router.put("/orders/:id/status", verifyToken, authorizeRoles("delivery_agent"), updateOrderStatus);

// PUT  /location             → verifyToken, authorizeRoles("delivery_agent"), updateLocation
router.put("/location", verifyToken, authorizeRoles("delivery_agent"), updateLocation);

module.exports = router;
