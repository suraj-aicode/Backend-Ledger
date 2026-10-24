const express = require('express');
const accountMiddleware = require('../middlewares/auth.middleware');
const accountController = require('../controllers/account.controller');


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



module.exports = router;