const express = require('express');
const accountController = require('../controllers/account.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { validateAccountIdParam } = require('../middlewares/validator.middleware');

const router = express.Router();

/**
 * - POST/api/account/create-account
 * - Create a new account
 * - Protected route
 */
router.post(
  "/create-account",
  authMiddleware.authMiddleware,
  accountController.createAccountController,
);

/**
 * - GET/api/account/
 * - Get user accounts
 * - Protected route
 */
router.get(
  "/",
  authMiddleware.authMiddleware,
  accountController.getUserAccountsController,
);

/**
 * - GET/api/account/balance/:accountId
 * - Get account balance
 * - Protected route
 */
router.get(
  "/balance/:accountId",
  authMiddleware.authMiddleware,
  validateAccountIdParam,
  accountController.getAccountBalanceController,
);

/**
 * - GET/api/account/ledger/:accountId
 * - Get account ledger history
 * - Protected route
 */
router.get(
  "/ledger/:accountId",
  authMiddleware.authMiddleware,
  validateAccountIdParam,
  accountController.getAccountLedgerController,
);

module.exports = router;