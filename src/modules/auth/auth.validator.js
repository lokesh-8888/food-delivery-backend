const { body } = require("express-validator");

const validateRegister = [
  body("name")
    .notEmpty()
    .withMessage("Name is required")
    .trim(),
  
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),
  
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  
  body("phone")
    .notEmpty()
    .withMessage("Phone number is required"),
  
  body("role")
    .optional()
    .isIn(["user", "restaurant_owner", "delivery_agent", "admin"])
    .withMessage("Role must be one of: user, restaurant_owner, delivery_agent, admin")
];

const validateLogin = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email"),
  
  body("password")
    .notEmpty()
    .withMessage("Password is required")
];

module.exports = { validateRegister, validateLogin };
