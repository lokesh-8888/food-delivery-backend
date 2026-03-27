function sanitizeInput(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const sanitized = {};
  
  for (const key in obj) {
    // Skip keys that start with $ or contain .
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }
    
    // Recursively sanitize nested objects
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      sanitized[key] = sanitizeInput(obj[key]);
    } else {
      sanitized[key] = obj[key];
    }
  }
  
  return sanitized;
}

module.exports = {
  sanitizeInput
};
