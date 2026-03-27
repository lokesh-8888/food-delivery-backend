const logger = require("../config/logger");

function requestLogger(req, res, next) {
  logger.info(`${req.method} ${req.originalUrl} — IP: ${req.ip}`);
  next();
}

module.exports = {
  requestLogger
};
