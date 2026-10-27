const express = require("express");
const transactionController = require("../controllers/transcation.controller");
const authMiddleware = require("../middlewares/auth.middleware");


const router = express.Router();

/**
* - POST /api/transaction
* - Create a new transaction
*/ 

router.post('/', authMiddleware.authMiddleware, transactionController.createTransaction);

/* 
* - POST /api/transaction/system/initiate-funds
* - Create initial funds transaction for a user
*/

router.post('/system/initiate-funds', authMiddleware.authSystemUserMiddleware, transactionController.createInitialFundsTransaction);

module.exports = router;