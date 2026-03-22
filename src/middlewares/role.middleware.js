const { ApiError } = require("../utils/ApiResponse");

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // If req.user.role not in roles → throw new ApiError(403, "Forbidden — you do not have permission")
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, "Forbidden — you do not have permission");
    }
    
    // If yes → call next()
    next();
  };
};

module.exports = { authorizeRoles };
