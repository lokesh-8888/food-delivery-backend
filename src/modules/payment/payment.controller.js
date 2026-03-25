const razorpay = require("../../config/razorpay");
const Order = require("../../models/Order");
const { ApiResponse, ApiError } = require("../../utils/ApiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const crypto = require("crypto");

const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  
  // Find order by orderId where user: req.user.id
  const order = await Order.findOne({ _id: orderId, user: req.user.id });
  
  // If not found → throw ApiError(404, "Order not found")
  if (!order) {
    throw new ApiError(404, "Order not found");
  }
  
  // If paymentMethod is not "online" → throw ApiError(400, "This order is not an online payment order")
  if (order.paymentMethod !== "online") {
    throw new ApiError(400, "This order is not an online payment order");
  }
  
  // If paymentStatus is already "paid" → throw ApiError(400, "Order already paid")
  if (order.paymentStatus === "paid") {
    throw new ApiError(400, "Order already paid");
  }
  
  // Create Razorpay order:
  const razorpayOrder = await razorpay.orders.create({
    amount: order.totalAmount * 100, // Razorpay uses paise
    currency: "INR",
    receipt: order._id.toString(),
    notes: {
      orderId: order._id.toString(),
      userId: req.user.id.toString()
    }
  });
  
  // Save razorpayOrderId to the order document
  order.razorpayOrderId = razorpayOrder.id;
  await order.save();
  
  // Return ApiResponse(200, { razorpayOrderId, amount, currency, key: process.env.RAZORPAY_KEY_ID }, "Razorpay order created")
  res.status(200).json(new ApiResponse(200, {
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    key: process.env.RAZORPAY_KEY_ID
  }, "Razorpay order created"));
});

const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;
  
  // Verify signature using crypto:
  const body = razorpayOrderId + "|" + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");
  
  // If signature does not match → throw ApiError(400, "Invalid payment signature — payment verification failed")
  if (expectedSignature !== razorpaySignature) {
    throw new ApiError(400, "Invalid payment signature — payment verification failed");
  }
  
  // Find order by orderId where user: req.user.id
  const order = await Order.findOne({ _id: orderId, user: req.user.id });
  
  // If not found → throw ApiError(404, "Order not found")
  if (!order) {
    throw new ApiError(404, "Order not found");
  }
  
  // Update order:
  order.razorpayPaymentId = razorpayPaymentId;
  order.paymentStatus = "paid";
  
  await order.save();
  
  // Return ApiResponse(200, { order }, "Payment verified successfully")
  res.status(200).json(new ApiResponse(200, { order }, "Payment verified successfully"));
});

const handleWebhook = asyncHandler(async (req, res) => {
  // Verify webhook signature:
  const signature = req.headers["x-razorpay-signature"];
  const body = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest("hex");
  
  // If signature does not match → return res.status(400).json({ success: false, message: "Invalid webhook signature" })
  if (expectedSignature !== signature) {
    return res.status(400).json({ success: false, message: "Invalid webhook signature" });
  }
  
  // Handle these webhook events from req.body.event:
  const event = req.body.event;
  const payload = req.body.payload;
  
  if (event === "payment.captured") {
    // "payment.captured" → find order by razorpayOrderId, set paymentStatus: "paid", save
    const razorpayOrderId = payload.payment.entity.order_id;
    await Order.findOneAndUpdate(
      { razorpayOrderId },
      { paymentStatus: "paid" }
    );
  } else if (event === "payment.failed") {
    // "payment.failed" → find order by razorpayOrderId, set paymentStatus: "failed", save
    const razorpayOrderId = payload.payment.entity.order_id;
    await Order.findOneAndUpdate(
      { razorpayOrderId },
      { paymentStatus: "failed" }
    );
  } else if (event === "refund.processed") {
    // "refund.processed" → find order by razorpayOrderId, set paymentStatus: "refunded", save
    const razorpayOrderId = payload.refund.entity.order_id;
    await Order.findOneAndUpdate(
      { razorpayOrderId },
      { paymentStatus: "refunded" }
    );
  }
  
  // Return res.status(200).json({ success: true, message: "Webhook processed" })
  res.status(200).json({ success: true, message: "Webhook processed" });
});

const refundPayment = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  
  // Find order by orderId
  const order = await Order.findById(orderId);
  
  // If not found → throw ApiError(404, "Order not found")
  if (!order) {
    throw new ApiError(404, "Order not found");
  }
  
  // If paymentStatus is not "paid" → throw ApiError(400, "Order is not paid — cannot refund")
  if (order.paymentStatus !== "paid") {
    throw new ApiError(400, "Order is not paid — cannot refund");
  }
  
  // Create Razorpay refund:
  const refund = await razorpay.payments.refund(order.razorpayPaymentId, {
    amount: order.totalAmount * 100
  });
  
  // Update order paymentStatus: "refunded"
  order.paymentStatus = "refunded";
  await order.save();
  
  // Return ApiResponse(200, { order }, "Refund initiated successfully")
  res.status(200).json(new ApiResponse(200, { order }, "Refund initiated successfully"));
});

module.exports = {
  createRazorpayOrder,
  verifyPayment,
  handleWebhook,
  refundPayment
};
