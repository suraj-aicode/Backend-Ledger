const express = require('express');
const accountMiddleware = require('../middlewares/auth.middleware');
const accountController = require('../controllers/account.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * - POST/api/account
 * - Create a new account
 * - Protected route
 */

router.post(
  "/create-account",
  accountMiddleware.authMiddleware,
  accountController.createAccountController,
);

/**
 * - POST/api/account/
 * - Get user accounts
 * - Protected route
 */

router.get(
  "/",
  authMiddleware.authMiddleware,
  accountController.getUserAccountsController,
);

/**
 * - POST/api/account/balance:accountId
 * - Get account balance
 * - Protected route
 */
router.get(
  "/balance/:accountId",
  authMiddleware.authMiddleware,
  accountController.getAccountBalanceController,
);


module.exports = router;