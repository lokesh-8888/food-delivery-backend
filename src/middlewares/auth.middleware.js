const jwt = require("jsonwebtoken");
const { ApiError } = require("../utils/ApiResponse");

const verifyToken = (req, res, next) => {
  // Read token from req.cookies.token first
  let token = req.cookies.token;

  // If not in cookies, check Authorization header as Bearer <token>
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // If no token found → throw new ApiError(401, "Unauthorized — no token provided")
  if (!token) {
    throw new ApiError(401, "Unauthorized — no token provided");
  }

  try {
    // Verify using jwt.verify(token, process.env.JWT_SECRET)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // If valid → attach decoded payload to req.user
    req.user = decoded;
    
    next();
  } catch (error) {
    // If invalid or expired → throw new ApiError(401, "Unauthorized — invalid or expired token")
    throw new ApiError(401, "Unauthorized — invalid or expired token");
  }
};

module.exports = { verifyToken };
