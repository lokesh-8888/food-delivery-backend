const DeliveryAgent = require("../../models/DeliveryAgent");
const Order = require("../../models/Order");
const User = require("../../models/User");
const { ApiResponse, ApiError } = require("../../utils/ApiResponse");
const asyncHandler = require("../../utils/asyncHandler");

const getProfile = asyncHandler(async (req, res) => {
  // Find DeliveryAgent where user: req.user.id
  const agent = await DeliveryAgent.findOne({ user: req.user.id })
    .populate('user', 'name email phone')
    .populate('activeOrder', 'status deliveryAddress');
  
  // If not found → throw ApiError(404, "Delivery agent profile not found")
  if (!agent) {
    throw new ApiError(404, "Delivery agent profile not found");
  }
  
  // Return ApiResponse(200, { agent }, "Profile fetched successfully")
  res.status(200).json(new ApiResponse(200, { agent }, "Profile fetched successfully"));
});

const toggleAvailability = asyncHandler(async (req, res) => {
  // Find DeliveryAgent where user: req.user.id
  const agent = await DeliveryAgent.findOne({ user: req.user.id });
  
  // If not found → throw ApiError(404, "Delivery agent not found")
  if (!agent) {
    throw new ApiError(404, "Delivery agent not found");
  }
  
  // If agent has activeOrder that is not null → throw ApiError(400, "Cannot change availability while on an active order")
  if (agent.activeOrder) {
    throw new ApiError(400, "Cannot change availability while on an active order");
  }
  
  // Toggle isAvailable to opposite value
  agent.isAvailable = !agent.isAvailable;
  await agent.save();
  
  // Return ApiResponse(200, { isAvailable: agent.isAvailable }, "Availability updated successfully")
  res.status(200).json(new ApiResponse(200, { isAvailable: agent.isAvailable }, "Availability updated successfully"));
});

const getAssignedOrders = asyncHandler(async (req, res) => {
  // Find DeliveryAgent where user: req.user.id
  const agent = await DeliveryAgent.findOne({ user: req.user.id });
  
  if (!agent) {
    throw new ApiError(404, "Delivery agent not found");
  }
  
  // Find all orders where deliveryAgent: agent.user
  const orders = await Order.find({ deliveryAgent: agent.user })
    .populate('restaurant', 'name address')
    .populate('user', 'name phone')
    .sort({ createdAt: -1 });
  
  // Return ApiResponse(200, { orders }, "Orders fetched successfully")
  res.status(200).json(new ApiResponse(200, { orders }, "Orders fetched successfully"));
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  
  // Find DeliveryAgent where user: req.user.id
  const agent = await DeliveryAgent.findOne({ user: req.user.id });
  
  if (!agent) {
    throw new ApiError(404, "Delivery agent not found");
  }
  
  // Find order by req.params.id where deliveryAgent: agent.user
  const order = await Order.findOne({ _id: req.params.id, deliveryAgent: agent.user });
  
  // If not found → throw ApiError(404, "Order not found")
  if (!order) {
    throw new ApiError(404, "Order not found");
  }
  
  // Allowed status transitions from delivery agent side:
  // ready → out_for_delivery
  // out_for_delivery → delivered
  
  const validTransitions = {
    'ready': ['out_for_delivery'],
    'out_for_delivery': ['delivered']
  };
  
  // If invalid transition → throw ApiError(400, "Invalid status transition")
  if (!validTransitions[order.status] || !validTransitions[order.status].includes(status)) {
    throw new ApiError(400, "Invalid status transition");
  }
  
  // Update status and push to timeline { status: newStatus }
  order.status = status;
  order.timeline.push({ status });
  
  // If status is "delivered":
  if (status === 'delivered') {
    // Set agent isAvailable: true and activeOrder: null
    agent.isAvailable = true;
    agent.activeOrder = null;
    // Increment agent totalDeliveries by 1
    agent.totalDeliveries += 1;
    
    // If order paymentMethod is "cod" → set paymentStatus: "paid"
    if (order.paymentMethod === 'cod') {
      order.paymentStatus = 'paid';
    }
    
    await agent.save();
  }
  
  await order.save();
  
  // Return ApiResponse(200, { order }, "Order status updated successfully")
  res.status(200).json(new ApiResponse(200, { order }, "Order status updated successfully"));
});

const updateLocation = asyncHandler(async (req, res) => {
  const { lat, lng } = req.body;
  
  // Find DeliveryAgent where user: req.user.id
  const agent = await DeliveryAgent.findOne({ user: req.user.id });
  
  // If not found → throw ApiError(404, "Delivery agent not found")
  if (!agent) {
    throw new ApiError(404, "Delivery agent not found");
  }
  
  // Validate req.body.lat and req.body.lng are valid numbers
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    throw new ApiError(400, "Invalid coordinates");
  }
  
  // Update currentLocation: { lat, lng, updatedAt: new Date() }
  agent.currentLocation = { lat, lng, updatedAt: new Date() };
  await agent.save();
  
  // Return ApiResponse(200, { currentLocation: agent.currentLocation }, "Location updated successfully")
  res.status(200).json(new ApiResponse(200, { currentLocation: agent.currentLocation }, "Location updated successfully"));
});

module.exports = {
  getProfile,
  toggleAvailability,
  getAssignedOrders,
  updateOrderStatus,
  updateLocation
};
