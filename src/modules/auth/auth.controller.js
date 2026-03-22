const User = require("../../models/User");
const DeliveryAgent = require("../../models/DeliveryAgent");
const { ApiResponse, ApiError } = require("../../utils/ApiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");

const register = asyncHandler(async (req, res) => {
  // Check validationResult(req) — if errors exist → throw ApiError(400, "Validation failed", errors.array())
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, "Validation failed", errors.array());
  }

  const { name, email, password, phone, role } = req.body;

  // Check if user with same email exists → throw ApiError(409, "Email already registered")
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "Email already registered");
  }

  // Create new User — password hashing handled by pre-save hook automatically
  const newUser = new User({
    name,
    email,
    password,
    phone,
    role: role || "user"
});
await newUser.save();

  // If role is "delivery_agent" → also create DeliveryAgent document with { user: newUser._id }
  if (newUser.role === "delivery_agent") {
    await DeliveryAgent.create({ user: newUser._id });
  }

  // Return res.status(201).json(new ApiResponse(201, { user: { id, name, email, role } }, "Registered successfully"))
  res.status(201).json(
    new ApiResponse(201, 
      { 
        user: { 
          id: newUser._id, 
          name: newUser.name, 
          email: newUser.email, 
          role: newUser.role 
        } 
      }, 
      "Registered successfully"
    )
  );
});

const login = asyncHandler(async (req, res) => {
  // Check validationResult — if errors → throw ApiError(400, "Validation failed", errors.array())
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, "Validation failed", errors.array());
  }

  const { email, password } = req.body;

  // Find user by email → not found → throw ApiError(404, "User not found")
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Check user.isActive → if false → throw ApiError(403, "Account banned — contact support")
  if (!user.isActive) {
    throw new ApiError(403, "Account banned — contact support");
  }

  // user.comparePassword(password) → if false → throw ApiError(401, "Invalid credentials")
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  // Generate JWT: jwt.sign({ id: user._id, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN })
  const token = jwt.sign(
    { id: user._id, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  // Set HTTP-only cookie: res.cookie("token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", maxAge: 7 * 24 * 60 * 60 * 1000 })
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  // Return res.status(200).json(new ApiResponse(200, { user: { id, name, email, role } }, "Login successful"))
  res.status(200).json(
    new ApiResponse(200, 
      { 
        user: { 
          id: user._id, 
          name: user.name, 
          email: user.email, 
          role: user.role 
        } 
      }, 
      "Login successful"
    )
  );
});

const logout = asyncHandler(async (req, res) => {
  // res.clearCookie("token")
  res.clearCookie("token");
  
  // Return res.status(200).json(new ApiResponse(200, {}, "Logged out successfully"))
  res.status(200).json(new ApiResponse(200, {}, "Logged out successfully"));
});

const getMe = asyncHandler(async (req, res) => {
  // Find user by req.user.id, select -password
  const user = await User.findById(req.user.id).select("-password");
  
  // Return res.status(200).json(new ApiResponse(200, { user }, "User fetched successfully"))
  res.status(200).json(new ApiResponse(200, { user }, "User fetched successfully"));
});

module.exports = { register, login, logout, getMe };
