const { body, param, validationResult } = require("express-validator");

/**
 * Middleware to check validation results and return formatted 400 error response
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: "Failed",
      message: errors.array()[0].msg,
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
}

/**
 * Validation rules for user registration
 */
const validateRegister = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters long"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  handleValidationErrors,
];

/**
 * Validation rules for user login
 */
const validateLogin = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required"),
  handleValidationErrors,
];

/**
 * Validation rules for routes with accountId route parameter
 */
const validateAccountIdParam = [
  param("accountId")
    .trim()
    .notEmpty()
    .withMessage("AccountId is required")
    .isMongoId()
    .withMessage("Invalid accountId format (must be a valid 24-char ObjectId)"),
  handleValidationErrors,
];

/**
 * Validation rules for creating a transaction (P2P Transfer)
 */
const validateCreateTransaction = [
  body("fromAccount")
    .trim()
    .notEmpty()
    .withMessage("fromAccount is required")
    .isMongoId()
    .withMessage("fromAccount must be a valid 24-char ObjectId"),
  body("toAccount")
    .trim()
    .notEmpty()
    .withMessage("toAccount is required")
    .isMongoId()
    .withMessage("toAccount must be a valid 24-char ObjectId")
    .custom((toAccount, { req }) => {
      if (toAccount === req.body.fromAccount) {
        throw new Error("fromAccount and toAccount cannot be the same");
      }
      return true;
    }),
  body("amount")
    .notEmpty()
    .withMessage("amount is required")
    .isFloat({ gt: 0 })
    .withMessage("amount must be a positive number greater than 0"),
  body("idempotencyKey")
    .custom((val, { req }) => {
      const key = val || req.body.itempotencyKey;
      if (!key || typeof key !== "string" || key.trim().length < 4) {
        throw new Error("idempotencyKey is required and must be at least 4 characters long");
      }
      return true;
    }),
  handleValidationErrors,
];

/**
 * Validation rules for system initial funds transaction
 */
const validateInitiateFunds = [
  body("toAccount")
    .trim()
    .notEmpty()
    .withMessage("toAccount is required")
    .isMongoId()
    .withMessage("toAccount must be a valid 24-char ObjectId"),
  body("amount")
    .notEmpty()
    .withMessage("amount is required")
    .isFloat({ gt: 0 })
    .withMessage("amount must be a positive number greater than 0"),
  body("idempotencyKey")
    .custom((val, { req }) => {
      const key = val || req.body.itempotencyKey;
      if (!key || typeof key !== "string" || key.trim().length < 4) {
        throw new Error("idempotencyKey is required and must be at least 4 characters long");
      }
      return true;
    }),
  handleValidationErrors,
];

module.exports = {
  handleValidationErrors,
  validateRegister,
  validateLogin,
  validateAccountIdParam,
  validateCreateTransaction,
  validateInitiateFunds,
};
