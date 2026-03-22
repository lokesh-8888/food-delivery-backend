const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  name: String,
  price: Number,
  quantity: {
    type: Number,
    required: true,
  },
});

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true,
  },
  deliveryAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"],
    default: "pending",
  },
  deliveryAddress: {
    street: String,
    city: String,
    pincode: String,
    coordinates: {
      lat: Number,
      lng: Number,
    },
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed", "refunded"],
    default: "pending",
  },
  paymentMethod: {
    type: String,
    enum: ["cod", "online"],
    default: "cod",
  },
  razorpayOrderId: {
    type: String,
    default: null,
  },
  razorpayPaymentId: {
    type: String,
    default: null,
  },
  timeline: [{
    status: String,
    changedAt: {
      type: Date,
      default: Date.now,
    },
  }],
}, { timestamps: true });

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
