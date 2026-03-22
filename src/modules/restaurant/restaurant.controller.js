const Restaurant = require("../../models/Restaurant");
const Order = require("../../models/Order");
const DeliveryAgent = require("../../models/DeliveryAgent");
const User = require("../../models/User");
const { ApiResponse, ApiError } = require("../../utils/ApiResponse");
const asyncHandler = require("../../utils/asyncHandler");

const createRestaurant = asyncHandler(async (req, res) => {
  // Check if restaurant already exists for req.user.id → throw ApiError(400, "Restaurant already exists for this owner")
  const existingRestaurant = await Restaurant.findOne({ owner: req.user.id });
  if (existingRestaurant) {
    throw new ApiError(400, "Restaurant already exists for this owner");
  }
  
  // Create restaurant with owner: req.user.id
  const restaurant = await Restaurant.create({
    owner: req.user.id,
    ...req.body
  });
  
  // Return ApiResponse(201, { restaurant }, "Restaurant created successfully")
  res.status(201).json(new ApiResponse(201, { restaurant }, "Restaurant created successfully"));
});

const updateRestaurant = asyncHandler(async (req, res) => {
  // Find restaurant by owner: req.user.id
  const restaurant = await Restaurant.findOne({ owner: req.user.id });
  
  // If not found → throw ApiError(404, "Restaurant not found")
  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }
  
  // Allowed fields: name, phone, email, cuisine, address
  const { name, phone, email, cuisine, address } = req.body;
  const updateData = {};
  
  if (name) updateData.name = name;
  if (phone) updateData.phone = phone;
  if (email) updateData.email = email;
  if (cuisine) updateData.cuisine = cuisine;
  if (address) updateData.address = address;
  
  // Update and return ApiResponse(200, { restaurant }, "Restaurant updated successfully")
  const updatedRestaurant = await Restaurant.findByIdAndUpdate(
    restaurant._id,
    updateData,
    { new: true, runValidators: true }
  );
  
  res.status(200).json(new ApiResponse(200, { restaurant: updatedRestaurant }, "Restaurant updated successfully"));
});

const toggleStatus = asyncHandler(async (req, res) => {
  // Find restaurant by owner: req.user.id
  const restaurant = await Restaurant.findOne({ owner: req.user.id });
  
  // If not found → throw ApiError(404, "Restaurant not found")
  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }
  
  // If isApproved: false → throw ApiError(403, "Restaurant not approved yet")
  if (!restaurant.isApproved) {
    throw new ApiError(403, "Restaurant not approved yet");
  }
  
  // Toggle isOpen to opposite value
  restaurant.isOpen = !restaurant.isOpen;
  await restaurant.save();
  
  // Return ApiResponse(200, { isOpen: restaurant.isOpen }, "Status updated successfully")
  res.status(200).json(new ApiResponse(200, { isOpen: restaurant.isOpen }, "Status updated successfully"));
});

const addMenuItem = asyncHandler(async (req, res) => {
  // Find restaurant by owner: req.user.id
  const restaurant = await Restaurant.findOne({ owner: req.user.id });
  
  // If not found → throw ApiError(404, "Restaurant not found")
  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }
  
  // Push new item to restaurant.menu
  restaurant.menu.push(req.body);
  await restaurant.save();
  
  // Return ApiResponse(201, { menu: restaurant.menu }, "Menu item added successfully")
  res.status(201).json(new ApiResponse(201, { menu: restaurant.menu }, "Menu item added successfully"));
});

const updateMenuItem = asyncHandler(async (req, res) => {
  // Find restaurant by owner: req.user.id
  const restaurant = await Restaurant.findOne({ owner: req.user.id });
  
  // If not found → throw ApiError(404, "Restaurant not found")
  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }
  
  // Find menu item by req.params.itemId inside menu array
  const menuItem = restaurant.menu.id(req.params.itemId);
  
  // If not found → throw ApiError(404, "Menu item not found")
  if (!menuItem) {
    throw new ApiError(404, "Menu item not found");
  }
  
  // Update allowed fields: name, description, price, category, image, isAvailable
  const { name, description, price, category, image, isAvailable } = req.body;
  
  if (name !== undefined) menuItem.name = name;
  if (description !== undefined) menuItem.description = description;
  if (price !== undefined) menuItem.price = price;
  if (category !== undefined) menuItem.category = category;
  if (image !== undefined) menuItem.image = image;
  if (isAvailable !== undefined) menuItem.isAvailable = isAvailable;
  
  await restaurant.save();
  
  // Return ApiResponse(200, { menu: restaurant.menu }, "Menu item updated successfully")
  res.status(200).json(new ApiResponse(200, { menu: restaurant.menu }, "Menu item updated successfully"));
});

const deleteMenuItem = asyncHandler(async (req, res) => {
  // Find restaurant by owner: req.user.id
  const restaurant = await Restaurant.findOne({ owner: req.user.id });
  
  // If not found → throw ApiError(404, "Restaurant not found")
  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }
  
  // Remove item from menu array using pull or filter
  restaurant.menu.pull({ _id: req.params.itemId });
  await restaurant.save();
  
  // Return ApiResponse(200, { menu: restaurant.menu }, "Menu item deleted successfully")
  res.status(200).json(new ApiResponse(200, { menu: restaurant.menu }, "Menu item deleted successfully"));
});

const getRestaurantOrders = asyncHandler(async (req, res) => {
  // Find restaurant by owner: req.user.id
  const restaurant = await Restaurant.findOne({ owner: req.user.id });
  
  // If not found → throw ApiError(404, "Restaurant not found")
  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }
  
  // Find all orders where restaurant: restaurant._id
  const orders = await Order.find({ restaurant: restaurant._id })
    .populate('user', 'name phone')
    .populate('deliveryAgent', 'name')
    .sort({ createdAt: -1 });
  
  // Return ApiResponse(200, { orders }, "Orders fetched successfully")
  res.status(200).json(new ApiResponse(200, { orders }, "Orders fetched successfully"));
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  
  // Find restaurant by owner: req.user.id
  const restaurant = await Restaurant.findOne({ owner: req.user.id });
  
  // If not found → throw ApiError(404, "Restaurant not found")
  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }
  
  // Find order by req.params.id where restaurant: restaurant._id
  const order = await Order.findOne({ _id: req.params.id, restaurant: restaurant._id });
  
  // If not found → throw ApiError(404, "Order not found")
  if (!order) {
    throw new ApiError(404, "Order not found");
  }
  
  // Allowed status transitions from restaurant side:
  // pending → confirmed or cancelled
  // confirmed → preparing
  // preparing → ready
  
  const validTransitions = {
    'pending': ['confirmed', 'cancelled'],
    'confirmed': ['preparing'],
    'preparing': ['ready']
  };
  
  // If invalid transition → throw ApiError(400, "Invalid status transition")
  if (!validTransitions[order.status] || !validTransitions[order.status].includes(status)) {
    throw new ApiError(400, "Invalid status transition");
  }
  
  // Update status and push to timeline { status: newStatus }
  order.status = status;
  order.timeline.push({ status });
  await order.save();
  
  // If status is "ready" and no delivery agent assigned yet → auto assign
  if (status === 'ready' && !order.deliveryAgent) {
    // Find DeliveryAgent where isAvailable: true AND activeOrder: null
    const availableAgent = await DeliveryAgent.findOne({ 
      isAvailable: true, 
      activeOrder: null 
    });
    
    // If found → assign to order, set agent isAvailable: false, activeOrder: order._id
    if (availableAgent) {
      await Order.findByIdAndUpdate(order._id, { deliveryAgent: availableAgent.user });
      await DeliveryAgent.findByIdAndUpdate(availableAgent._id, {
        isAvailable: false,
        activeOrder: order._id
      });
      
      // Refresh order to get updated deliveryAgent
      order.deliveryAgent = availableAgent.user;
    }
  }
  
  // Return ApiResponse(200, { order }, "Order status updated successfully")
  res.status(200).json(new ApiResponse(200, { order }, "Order status updated successfully"));
});

module.exports = {
  createRestaurant,
  updateRestaurant,
  toggleStatus,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getRestaurantOrders,
  updateOrderStatus
};
