const express = require("express");
const { verifyToken } = require("../../middlewares/auth.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");
const {
  createRazorpayOrder,
  verifyPayment,
  handleWebhook,
  refundPayment
} = require("./payment.controller");

const router = express.Router();

// POST /create-order    → verifyToken, authorizeRoles("user"), createRazorpayOrder
router.post("/create-order", verifyToken, authorizeRoles("user"), createRazorpayOrder);

// POST /verify          → verifyToken, authorizeRoles("user"), verifyPayment
router.post("/verify", verifyToken, authorizeRoles("user"), verifyPayment);

// POST /webhook         → handleWebhook (NO auth middleware — public route)
router.post("/webhook", handleWebhook);

// POST /refund/:orderId → verifyToken, authorizeRoles("admin"), refundPayment
router.post("/refund/:orderId", verifyToken, authorizeRoles("admin"), refundPayment);

module.exports = router;
