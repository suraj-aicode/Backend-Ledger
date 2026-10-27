const ledgerModel = require("../models/ledger.model");
const transactionModel = require("../models/transcation.model");
const accountModel = require("../models/account.model");
const emailService = require("../services/email.service");
const mongoose = require("mongoose");

/**
 * - Create a new transaction
 * - 1. Validate request
 * - 2. Validate itempotency key
 * - 3. Check account status
 * - 4. Derive sender balance from ledger
 * - 5. Create transaction
 * - 6. Create Debit ledger
 * - 7. Create Credit ledger
 * - 8. Mark transaction as completed
 * - 9. Commit MongoDB session
 * - 10. Send email notification
 */

async function createTransaction(req, res) {
  /* 1. Validate request */
  const { fromAccount, toAccount, amount, itempotencyKey } = req.body;

  if (!fromAccount || !toAccount || !amount || !itempotencyKey) {
    return res.status(400).json({
      message: "fromAccount, toAccount, amount and itempotencyKey are required",
    });
  }

  const fromUserAccount = await accountModel.findOne({ _id: fromAccount });

  const toUserAccount = await accountModel.findOne({ _id: toAccount });

  if (!fromUserAccount || !toUserAccount) {
    return res.status(404).json({
      message: "Invalid fromAccount or toAccount",
    });
  }

  // 2. Validate itempotency key

  const isTransactionAlreadyExists = await transactionModel.findOne({
    itempotencyKey: itempotencyKey,
  });

  if (isTransactionAlreadyExists) {
    if (isTransactionAlreadyExists.status === "COMPLETED") {
      return res.status(409).json({
        message: "Transaction already completed",
        transaction: isTransactionAlreadyExists,
      });
    }

    if (isTransactionAlreadyExists.status === "PENDING") {
      return res.status(200).json({
        message: "Transaction is still pending",
      });
    }

    if (isTransactionAlreadyExists.status === "FAILED") {
      return res.status(500).json({
        message: "Transaction failed please try again",
      });
    }

    if (isTransactionAlreadyExists.status === "REVERSED") {
      return res.status(500).json({
        message: "Transaction is reversed, please try again",
      });
    }
    }
    
    // 3. Check account status
    if(fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
        return res.status(400).json({
            message: "Both formAccounts and toAccounts must be ACTIVE to perform transaction"
        })
    }

    // 4. Derive sender balance from ledger
    const balance = await fromUserAccount.getBalance();
    if(balance < amount) {
        return res.status(400).json({
            message: `Insufficient balance. Current balance is ${balance}. Required amounts is ${amount}`
        })
    }

    // 5. Create transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    const transaction = new transactionModel({
      fromAccount,
      toAccount,
      amount,
      itempotencyKey,
      status: "PENDING",
    });
    
    // 6. Create Debit ledger
    const debitLedger = await ledgerModel.create([{
        account: fromAccount,
        amount,
        transaction: transaction._id,
        type: "DEBIT"
    }], { session })
    
    // 7. Create Credit ledger
    const creditLedger = await ledgerModel.create([{
        account: toAccount,
        amount,
        transaction: transaction._id,
        type: "CREDIT"
    }], { session })

    // 8. Mark transaction as completed
    transaction.status = "COMPLETED";
    await transaction.save({ session });

    // 9. Commit MongoDB session
    await session.commitTransaction();
    session.endSession();

    // 10. Send email notification
    await emailService.sendTransactionEmail(req.user.email, 
        req.user.name,
        amount,
        fromUserAccount._id,
        toUserAccount._id,
        transaction._id
    );

    return res.status(201).json({
        message: "Transaction completed successfully",
        transaction
    })
}

async function createInitialFundsTransaction(req, res) {
  const { toAccount, amount, itempotencyKey } = req.body;
  
  if (!toAccount || !amount || !itempotencyKey) {
    return res.status(400).json({
      message: "toAccount, amount and itempotencyKey are required",
    });
  }

  const toUserAccount = await accountModel.findOne({ _id: toAccount });

  if (!toUserAccount) {
    return res.status(404).json({
      message: "Invalid toAccount",
    });
  }

  const fromUserAccount = await accountModel.findOne({
    user : req.user._id
  });

  if (!fromUserAccount) {
    return res.status(404).json({
      message: "System user account not found",
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  const transaction = new transactionModel({
    fromAccount: fromUserAccount._id,
    toAccount,
    amount,
    itempotencyKey,
    status: "PENDING"
  });

  // Initial funds are created by the system, so only the recipient account
  // receives a credit. Debiting the system account would create a negative
  // balance for the account used to bootstrap funds.
  const creditLedger = await ledgerModel.create([{
    account: toUserAccount._id,
    amount,
    transaction: transaction._id,
    type: "CREDIT"
  }], { session });

  // Mark transaction as completed
  transaction.status = "COMPLETED";
  await transaction.save({ session });

  // Commit MongoDB session
  await session.commitTransaction();
  session.endSession();

  return res.status(201).json({
    message: "Initial funds transaction completed successfully",
    transaction
  });
}

module.exports = {
    createTransaction, createInitialFundsTransaction
}
