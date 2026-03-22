const mongoose = require("mongoose");

const deliveryAgentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  isAvailable: {
    type: Boolean,
    default: false,
  },
  activeOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    default: null,
  },
  currentLocation: {
    lat: Number,
    lng: Number,
    updatedAt: Date,
  },
  vehicleType: {
    type: String,
    enum: ["bike", "bicycle", "scooter"],
  },
  vehicleNumber: String,
  totalDeliveries: {
    type: Number,
    default: 0,
  },
  rating: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

const DeliveryAgent = mongoose.model("DeliveryAgent", deliveryAgentSchema);

module.exports = DeliveryAgent;
