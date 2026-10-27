const express = require("express");
const transactionController = require("../controllers/transcation.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { validateCreateTransaction, validateInitiateFunds } = require("../middlewares/validator.middleware");

const router = express.Router();

/**
* - GET /api/transaction
* - Get user transactions
*/
router.get('/', authMiddleware.authMiddleware, transactionController.getUserTransactions);

/**
* - POST /api/transaction
* - Create a new transaction
*/ 
router.post(
  '/',
  authMiddleware.authMiddleware,
  validateCreateTransaction,
  transactionController.createTransaction
);

/* 
* - POST /api/transaction/system/initiate-funds
* - Create initial funds transaction for a user
*/
router.post(
  '/system/initiate-funds',
  authMiddleware.authSystemUserMiddleware,
  validateInitiateFunds,
  transactionController.createInitialFundsTransaction
);

/**
* - GET /api/transaction/reconciliation
* - Mathematically verify double-entry ledger invariance & audit balances
*/
router.get(
  '/reconciliation',
  authMiddleware.authMiddleware,
  transactionController.reconcileLedger
);

module.exports = router;