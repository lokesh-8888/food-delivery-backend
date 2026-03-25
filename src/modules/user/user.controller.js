const User = require("../../models/User");
const Restaurant = require("../../models/Restaurant");
const Order = require("../../models/Order");
const DeliveryAgent = require("../../models/DeliveryAgent");
const Review = require("../../models/Review");
const Coupon = require("../../models/Coupon");
const { ApiResponse, ApiError } = require("../../utils/ApiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const { getIO } = require("../../socket/socket");

const getProfile = asyncHandler(async (req, res) => {
  // Find user by req.user.id excluding password field
  const user = await User.findById(req.user.id).select("-password");
  
  // Return ApiResponse(200, { user }, "Profile fetched successfully")
  res.status(200).json(new ApiResponse(200, { user }, "Profile fetched successfully"));
});

const updateProfile = asyncHandler(async (req, res) => {
  // Allowed fields to update: name, phone, address
  const { name, phone, address } = req.body;
  const updateData = {};
  
  if (name) updateData.name = name;
  if (phone) updateData.phone = phone;
  if (address) updateData.address = address;
  
  // Do NOT allow updating email, password or role here
  // Find user by req.user.id and update only allowed fields
  const user = await User.findByIdAndUpdate(
    req.user.id,
    updateData,
    { new: true, runValidators: true }
  ).select("-password");
  
  // Return ApiResponse(200, { user }, "Profile updated successfully")
  res.status(200).json(new ApiResponse(200, { user }, "Profile updated successfully"));
});

const getRestaurants = asyncHandler(async (req, res) => {
  const { search, city } = req.query;
  
  // Build query
  let query = { isApproved: true, isOpen: true };
  
  // Support optional query param ?search= that searches restaurant name or cuisine using MongoDB regex
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { cuisine: { $regex: search, $options: 'i' } }
    ];
  }
  
  // Support optional query param ?city= that filters by address.city
  if (city) {
    query['address.city'] = city;
  }
  
  // Find all restaurants where isApproved: true AND isOpen: true
  const restaurants = await Restaurant.find(query)
    .select('name phone email cuisine address rating totalRatings')
    .sort({ rating: -1 });
  
  // Return ApiResponse(200, { restaurants }, "Restaurants fetched successfully")
  res.status(200).json(new ApiResponse(200, { restaurants }, "Restaurants fetched successfully"));
});

const getRestaurantMenu = asyncHandler(async (req, res) => {
  // Find restaurant by req.params.id where isApproved: true
  const restaurant = await Restaurant.findOne({ 
    _id: req.params.id, 
    isApproved: true 
  }).select('menu');
  
  // If not found → throw ApiError(404, "Restaurant not found")
  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }
  
  // Return only the menu array
  // Return ApiResponse(200, { menu }, "Menu fetched successfully")
  res.status(200).json(new ApiResponse(200, { menu: restaurant.menu }, "Menu fetched successfully"));
});

const placeOrder = asyncHandler(async (req, res) => {
  const { restaurantId, items, deliveryAddress, paymentMethod, couponCode } = req.body;
  
  // Validate request body has restaurantId, items array, deliveryAddress, paymentMethod
  if (!restaurantId || !items || !Array.isArray(items) || items.length === 0 || !deliveryAddress || !paymentMethod) {
    throw new ApiError(400, "Missing required fields");
  }
  
  // Find restaurant → if not found or not approved → throw ApiError(404, "Restaurant not found")
  const restaurant = await Restaurant.findOne({ _id: restaurantId, isApproved: true });
  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }
  
  // Validate each item in items array exists in restaurant menu and isAvailable: true
  let totalAmount = 0;
  const orderItems = [];
  
  for (const item of items) {
    const menuItem = restaurant.menu.id(item.menuItem);
    if (!menuItem || !menuItem.isAvailable) {
      throw new ApiError(400, `Menu item ${item.menuItem} not available`);
    }
    
    // Calculate totalAmount from menu prices (use menu item price, not client sent price)
    const itemTotal = menuItem.price * item.quantity;
    totalAmount += itemTotal;
    
    orderItems.push({
      menuItem: item.menuItem,
      name: menuItem.name,
      price: menuItem.price,
      quantity: item.quantity
    });
  }
  
  // If coupon code provided in body → find Coupon by code where isActive: true and expiryDate > now and usedCount < usageLimit
  if (couponCode) {
    const coupon = await Coupon.findOne({
      code: couponCode.toUpperCase(),
      isActive: true,
      expiryDate: { $gt: new Date() },
      usedCount: { $lt: '$usageLimit' }
    });
    
    // If coupon not found or expired → throw ApiError(400, "Invalid or expired coupon")
    if (!coupon) {
      throw new ApiError(400, "Invalid or expired coupon");
    }
    
    // If coupon valid → apply discount to totalAmount
    let discount = 0;
    if (coupon.discountType === 'flat') {
      discount = Math.min(coupon.discountValue, totalAmount);
    } else if (coupon.discountType === 'percentage') {
      discount = (totalAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscount) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    }
    
    totalAmount -= discount;
    
    // Increment coupon.usedCount by 1 and save
    await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } });
  }
  
  // Auto assign delivery agent: find one DeliveryAgent where isAvailable: true AND activeOrder: null
  const availableAgent = await DeliveryAgent.findOne({ 
    isAvailable: true, 
    activeOrder: null 
  });
  
  let deliveryAgentId = null;
  if (availableAgent) {
    deliveryAgentId = availableAgent.user;
    // If found → set order.deliveryAgent to agent's user field, set agent's isAvailable: false and activeOrder to new order id
    // We'll update the agent after creating the order
  }
  
  // Create order with timeline: [{ status: "pending" }]
  const order = await Order.create({
    user: req.user.id,
    restaurant: restaurantId,
    deliveryAgent: deliveryAgentId,
    items: orderItems,
    totalAmount,
    deliveryAddress,
    paymentMethod,
    paymentStatus: 'pending',
    timeline: [{ status: "pending" }]
  });
  
  // If delivery agent was assigned, update the agent
  if (availableAgent) {
    await DeliveryAgent.findByIdAndUpdate(availableAgent._id, {
      isAvailable: false,
      activeOrder: order._id
    });
  }
  
  // Emit new_order event to restaurant room
  const io = getIO();
  io.to(`restaurant_${restaurantId}`).emit("new_order", { order });
  
  // Return ApiResponse(201, { order }, "Order placed successfully")
  res.status(201).json(new ApiResponse(201, { order }, "Order placed successfully"));
});

const getOrderHistory = asyncHandler(async (req, res) => {
  // Find all orders where user: req.user.id
  const orders = await Order.find({ user: req.user.id })
    .populate('restaurant', 'name address')
    .populate('deliveryAgent', 'name')
    .sort({ createdAt: -1 });
  
  // Return ApiResponse(200, { orders }, "Orders fetched successfully")
  res.status(200).json(new ApiResponse(200, { orders }, "Orders fetched successfully"));
});

const trackOrder = asyncHandler(async (req, res) => {
  // Find order by req.params.id where user: req.user.id
  const order = await Order.findOne({ _id: req.params.id, user: req.user.id })
    .populate('restaurant', 'name')
    .populate('deliveryAgent', 'name');
  
  // If not found → throw ApiError(404, "Order not found")
  if (!order) {
    throw new ApiError(404, "Order not found");
  }
  
  // Return ApiResponse(200, { order }, "Order fetched successfully")
  res.status(200).json(new ApiResponse(200, { order }, "Order fetched successfully"));
});

const cancelOrder = asyncHandler(async (req, res) => {
  // Find order by req.params.id where user: req.user.id
  const order = await Order.findOne({ _id: req.params.id, user: req.user.id });
  
  // If not found → throw ApiError(404, "Order not found")
  if (!order) {
    throw new ApiError(404, "Order not found");
  }
  
  // If order.status is not "pending" → throw ApiError(400, "Order cannot be cancelled at this stage")
  if (order.status !== 'pending') {
    throw new ApiError(400, "Order cannot be cancelled at this stage");
  }
  
  // Update status to "cancelled"
  order.status = 'cancelled';
  // Push to timeline: { status: "cancelled" }
  order.timeline.push({ status: 'cancelled' });
  await order.save();
  
  // If a delivery agent was assigned → set agent's isAvailable: true and activeOrder: null
  if (order.deliveryAgent) {
    await DeliveryAgent.findOneAndUpdate(
      { user: order.deliveryAgent },
      { isAvailable: true, activeOrder: null }
    );
  }
  
  // Return ApiResponse(200, { order }, "Order cancelled successfully")
  res.status(200).json(new ApiResponse(200, { order }, "Order cancelled successfully"));
});

const submitReview = asyncHandler(async (req, res) => {
  const { orderId, restaurantId, deliveryAgentId, rating, comment } = req.body;
  
  // Find order by req.body.orderId where user: req.user.id and status: "delivered"
  const order = await Order.findOne({ 
    _id: orderId, 
    user: req.user.id, 
    status: 'delivered' 
  });
  
  // If not found → throw ApiError(404, "Order not found or not delivered yet")
  if (!order) {
    throw new ApiError(404, "Order not found or not delivered yet");
  }
  
  // Check if review already exists for this order → throw ApiError(400, "Review already submitted")
  const existingReview = await Review.findOne({ order: orderId });
  if (existingReview) {
    throw new ApiError(400, "Review already submitted");
  }
  
  // Create Review document
  const review = await Review.create({
    user: req.user.id,
    restaurant: restaurantId || order.restaurant,
    deliveryAgent: deliveryAgentId,
    order: orderId,
    rating,
    comment
  });
  
  // If restaurantId provided → update restaurant's rating
  if (restaurantId || order.restaurant) {
    const restaurant = await Restaurant.findById(restaurantId || order.restaurant);
    if (restaurant) {
      // newRating = (restaurant.rating * restaurant.totalRatings + review.rating) / (restaurant.totalRatings + 1)
      const newRating = (restaurant.rating * restaurant.totalRatings + rating) / (restaurant.totalRatings + 1);
      // Increment totalRatings by 1
      await Restaurant.findByIdAndUpdate(restaurant._id, {
        rating: newRating,
        $inc: { totalRatings: 1 }
      });
    }
  }
  
  // Return ApiResponse(201, { review }, "Review submitted successfully")
  res.status(201).json(new ApiResponse(201, { review }, "Review submitted successfully"));
});

module.exports = {
  getProfile,
  updateProfile,
  getRestaurants,
  getRestaurantMenu,
  placeOrder,
  getOrderHistory,
  trackOrder,
  cancelOrder,
  submitReview
};
