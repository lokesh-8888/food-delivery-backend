const User = require("../../models/User");
const Restaurant = require("../../models/Restaurant");
const Order = require("../../models/Order");
const DeliveryAgent = require("../../models/DeliveryAgent");
const { ApiResponse, ApiError } = require("../../utils/ApiResponse");
const asyncHandler = require("../../utils/asyncHandler");

const getAllUsers = asyncHandler(async (req, res) => {
  const { role, search } = req.query;
  
  // Build query
  let query = {};
  
  // Support optional query param ?role= to filter by role
  if (role) {
    query.role = role;
  }
  
  // Support optional query param ?search= to search by name or email using regex
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  
  // Find all users excluding password field
  const users = await User.find(query)
    .select("-password")
    .sort({ createdAt: -1 });
  
  // Return ApiResponse(200, { users, total: users.length }, "Users fetched successfully")
  res.status(200).json(new ApiResponse(200, { users, total: users.length }, "Users fetched successfully"));
});

const toggleUserStatus = asyncHandler(async (req, res) => {
  // Find user by req.params.id
  const user = await User.findById(req.params.id);
  
  // If not found → throw ApiError(404, "User not found")
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  
  // Prevent admin from banning another admin → throw ApiError(403, "Cannot ban another admin")
  if (user.role === 'admin' && user._id.toString() !== req.user.id) {
    throw new ApiError(403, "Cannot ban another admin");
  }
  
  // Toggle isActive to opposite value
  user.isActive = !user.isActive;
  await user.save();
  
  // Return ApiResponse(200, { isActive: user.isActive }, "User status updated successfully")
  res.status(200).json(new ApiResponse(200, { isActive: user.isActive }, "User status updated successfully"));
});

const getAllRestaurants = asyncHandler(async (req, res) => {
  const { approved } = req.query;
  
  // Build query
  let query = {};
  
  // Support optional query param ?approved=true/false to filter by isApproved
  if (approved !== undefined) {
    query.isApproved = approved === 'true';
  }
  
  // Find all restaurants
  const restaurants = await Restaurant.find(query)
    .populate('owner', 'name email')
    .sort({ createdAt: -1 });
  
  // Return ApiResponse(200, { restaurants, total: restaurants.length }, "Restaurants fetched successfully")
  res.status(200).json(new ApiResponse(200, { restaurants, total: restaurants.length }, "Restaurants fetched successfully"));
});

const approveRestaurant = asyncHandler(async (req, res) => {
  // Find restaurant by req.params.id
  const restaurant = await Restaurant.findById(req.params.id);
  
  // If not found → throw ApiError(404, "Restaurant not found")
  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }
  
  // Set isApproved: true
  restaurant.isApproved = true;
  await restaurant.save();
  
  // Return ApiResponse(200, { restaurant }, "Restaurant approved successfully")
  res.status(200).json(new ApiResponse(200, { restaurant }, "Restaurant approved successfully"));
});

const getAllOrders = asyncHandler(async (req, res) => {
  const { status } = req.query;
  
  // Build query
  let query = {};
  
  // Support optional query param ?status= to filter by status
  if (status) {
    query.status = status;
  }
  
  // Find all orders
  const orders = await Order.find(query)
    .populate('user', 'name phone')
    .populate('restaurant', 'name')
    .populate('deliveryAgent', 'name')
    .sort({ createdAt: -1 });
  
  // Return ApiResponse(200, { orders, total: orders.length }, "Orders fetched successfully")
  res.status(200).json(new ApiResponse(200, { orders, total: orders.length }, "Orders fetched successfully"));
});

const getAllDeliveryAgents = asyncHandler(async (req, res) => {
  // Find all DeliveryAgents
  const agents = await DeliveryAgent.find({})
    .populate('user', 'name email phone')
    .populate('activeOrder', 'status')
    .sort({ createdAt: -1 });
  
  // Return ApiResponse(200, { agents, total: agents.length }, "Delivery agents fetched successfully")
  res.status(200).json(new ApiResponse(200, { agents, total: agents.length }, "Delivery agents fetched successfully"));
});

const getDashboardStats = asyncHandler(async (req, res) => {
  // Run these DB queries in parallel using Promise.all:
  const [
    totalUsers,
    totalRestaurants,
    totalOrders,
    totalDeliveredOrders,
    totalRevenue,
    activeDeliveryAgents,
    pendingOrders
  ] = await Promise.all([
    // Total users count where role is "user"
    User.countDocuments({ role: 'user' }),
    // Total restaurants count
    Restaurant.countDocuments(),
    // Total orders count
    Order.countDocuments(),
    // Total delivered orders count
    Order.countDocuments({ status: 'delivered' }),
    // Total revenue: sum of totalAmount where paymentStatus: "paid"
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]),
    // Active delivery agents count where isAvailable: true
    DeliveryAgent.countDocuments({ isAvailable: true }),
    // Total pending orders count where status: "pending"
    Order.countDocuments({ status: 'pending' })
  ]);
  
  const stats = {
    totalUsers,
    totalRestaurants,
    totalOrders,
    totalDeliveredOrders,
    totalRevenue: totalRevenue[0]?.total || 0,
    activeDeliveryAgents,
    pendingOrders
  };
  
  // Return ApiResponse(200, { stats }, "Dashboard stats fetched successfully")
  res.status(200).json(new ApiResponse(200, { stats }, "Dashboard stats fetched successfully"));
});

module.exports = {
  getAllUsers,
  toggleUserStatus,
  getAllRestaurants,
  approveRestaurant,
  getAllOrders,
  getAllDeliveryAgents,
  getDashboardStats
};
