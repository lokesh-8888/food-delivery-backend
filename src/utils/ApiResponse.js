class ApiResponse {
  constructor(statusCode, data = {}, message = "") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}

class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.errors = errors;
    this.success = false;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { ApiResponse, ApiError };
