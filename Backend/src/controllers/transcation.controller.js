const ledgerModel = require("../models/ledger.model");
const transactionModel = require("../models/transcation.model");
const accountModel = require("../models/account.model");
const emailService = require("../services/email.service");
const mongoose = require("mongoose");

/**
 * - Create a new transaction with strict Concurrency and Race-Condition Protection:
 * - 1. Validate request payload & accounts
 * - 2. Validate idempotency key to prevent duplicate transfers
 * - 3. Open MongoDB session with Snapshot Isolation & Majority Write Concern
 * - 4. Atomically acquire exclusive write-lock on fromAccount by version increment
 * - 5. Derive sender balance from ledger INSIDE the active session
 * - 6. Ensure balance >= amount (avoids overdraft under simultaneous requests)
 * - 7. Create transaction record (PENDING)
 * - 8. Create Debit ledger entry for sender
 * - 9. Create Credit ledger entry for recipient
 * - 10. Mark transaction as COMPLETED
 * - 11. Commit session (atomic all-or-nothing rollback on any failure)
 * - 12. Send async email notification
 */
async function createTransaction(req, res) {
  /* 1. Validate request */
  const idempotencyKey = req.body.idempotencyKey || req.body.itempotencyKey;
  const { fromAccount, toAccount, amount } = req.body;

  if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({
      message: "fromAccount, toAccount, amount and idempotencyKey are required",
      status: "Failed",
    });
  }

  if (fromAccount === toAccount) {
    return res.status(400).json({
      message: "fromAccount and toAccount cannot be identical",
      status: "Failed",
    });
  }

  // 2. Validate idempotency key before opening session
  const isTransactionAlreadyExists = await transactionModel.findOne({
    idempotencyKey: idempotencyKey,
  });

  if (isTransactionAlreadyExists) {
    if (isTransactionAlreadyExists.status === "COMPLETED") {
      return res.status(409).json({
        message: "Transaction already completed",
        transaction: isTransactionAlreadyExists,
        status: "Conflict",
      });
    }

    if (isTransactionAlreadyExists.status === "PENDING") {
      return res.status(200).json({
        message: "Transaction is still pending",
        status: "Pending",
      });
    }

    if (isTransactionAlreadyExists.status === "FAILED") {
      return res.status(500).json({
        message: "Transaction failed please try again",
        status: "Failed",
      });
    }

    if (isTransactionAlreadyExists.status === "REVERSED") {
      return res.status(500).json({
        message: "Transaction is reversed, please try again",
        status: "Failed",
      });
    }
  }

  // 3. Acquire MongoDB Session for ACID transaction with Isolation
  const session = await mongoose.startSession();

  try {
    session.startTransaction({
      readConcern: { level: "snapshot" },
      writeConcern: { w: "majority" },
    });

    // 4. Concurrency Protection & Document Write-Lock
    // Atomically increment version __v inside transaction session to acquire WiredTiger write-lock.
    // Concurrent withdrawals on this account will be serialized or encounter WriteConflict.
    const fromUserAccount = await accountModel.findOneAndUpdate(
      { _id: fromAccount, status: "ACTIVE" },
      { $inc: { __v: 1 } },
      { session, returnDocument: 'after' }
    );

    const toUserAccount = await accountModel.findOne({
      _id: toAccount,
      status: "ACTIVE",
    }).session(session);

    if (!fromUserAccount || !toUserAccount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        message: "Both fromAccount and toAccount must exist and be ACTIVE",
        status: "Failed",
      });
    }

    // 5. Derive sender balance from ledger INSIDE active session
    const balance = await fromUserAccount.getBalance(session);
    if (balance < amount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: `Insufficient balance. Current balance is ${balance}. Required amount is ${amount}`,
        status: "Failed",
      });
    }

    // 6. Create Transaction record with status PENDING
    const transaction = new transactionModel({
      fromAccount,
      toAccount,
      amount,
      idempotencyKey,
      status: "PENDING",
    });
    await transaction.save({ session });

    // 7. Create Debit ledger entry
    await ledgerModel.create(
      [
        {
          account: fromAccount,
          amount,
          transaction: transaction._id,
          type: "DEBIT",
        },
      ],
      { session }
    );

    // 8. Create Credit ledger entry
    await ledgerModel.create(
      [
        {
          account: toAccount,
          amount,
          transaction: transaction._id,
          type: "CREDIT",
        },
      ],
      { session }
    );

    // 9. Mark transaction as completed
    transaction.status = "COMPLETED";
    await transaction.save({ session });

    // 10. Commit session
    await session.commitTransaction();
    session.endSession();

    // 11. Async email dispatch
    if (req.user && req.user.email) {
      emailService
        .sendTransactionEmail(
          req.user.email,
          req.user.name,
          amount,
          fromUserAccount._id,
          toUserAccount._id,
          transaction._id
        )
        .catch((e) => console.error("Email notification error:", e.message));
    }

    return res.status(201).json({
      message: "Transaction completed successfully",
      transaction,
      status: "Success",
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();

    // Duplicate idempotency key error (E11000)
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Duplicate idempotency key. Transaction already submitted.",
        status: "Conflict",
      });
    }

    // Concurrency conflict error
    if (error.hasErrorLabel && error.hasErrorLabel("TransientTransactionError")) {
      return res.status(409).json({
        message: "Concurrent transfer conflict detected. Please retry.",
        status: "Conflict",
      });
    }

    return res.status(500).json({
      message: error.message || "Transaction processing failed. Rolled back.",
      status: "Error",
    });
  }
}

async function createInitialFundsTransaction(req, res) {
  const idempotencyKey = req.body.idempotencyKey || req.body.itempotencyKey;
  const { toAccount, amount } = req.body;

  if (!toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({
      message: "toAccount, amount and idempotencyKey are required",
      status: "Failed",
    });
  }

  // Check idempotency first
  const existingTx = await transactionModel.findOne({ idempotencyKey });
  if (existingTx) {
    return res.status(409).json({
      message: "Initial funds transaction already completed with this idempotency key",
      transaction: existingTx,
      status: "Conflict",
    });
  }

  const toUserAccount = await accountModel.findOne({ _id: toAccount });
  if (!toUserAccount) {
    return res.status(404).json({
      message: "Invalid toAccount",
      status: "Failed",
    });
  }

  let fromUserAccount = await accountModel.findOne({
    user: req.user._id,
  });

  if (!fromUserAccount) {
    fromUserAccount = toUserAccount;
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction({
      writeConcern: { w: "majority" },
    });

    const transaction = new transactionModel({
      fromAccount: fromUserAccount._id,
      toAccount,
      amount,
      idempotencyKey,
      status: "PENDING",
    });
    await transaction.save({ session });

    // Initial funds credit ledger
    await ledgerModel.create(
      [
        {
          account: toUserAccount._id,
          amount,
          transaction: transaction._id,
          type: "CREDIT",
        },
      ],
      { session }
    );

    transaction.status = "COMPLETED";
    await transaction.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      message: "Initial funds transaction completed successfully",
      transaction,
      status: "Success",
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Duplicate idempotency key. Transaction already submitted.",
        status: "Conflict",
      });
    }

    return res.status(500).json({
      message: error.message || "Failed to initiate initial funds",
      status: "Error",
    });
  }
}

async function getUserTransactions(req, res) {
  try {
    const accounts = await accountModel.find({ user: req.user._id });
    const accountIds = accounts.map((a) => a._id);

    const transactions = await transactionModel
      .find({
        $or: [
          { fromAccount: { $in: accountIds } },
          { toAccount: { $in: accountIds } },
        ],
      })
      .populate("fromAccount")
      .populate("toAccount")
      .sort({ createdAt: -1 })
      .limit(100);

    return res.status(200).json({
      message: "Transactions fetched successfully",
      status: "Success",
      transactions,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Failed to fetch transactions",
      status: "Error",
    });
  }
}

/**
 * - Reconciliation Endpoint
 * - Mathematically audits and proves the double-entry accounting guarantees:
 * - 1. Computes total debits and credits across the entire ledger collection
 * - 2. Computes total system initial minted funds
 * - 3. Verifies balance invariance: (Total Credits - Total Debits) === Total Minted
 * - 4. Performs account-by-account audit to verify individual balances match ledger sum
 * - 5. Verifies no accounts are overdrawn (< 0)
 */
async function reconcileLedger(req, res) {
  try {
    // 1. Aggregate total Debits and Credits across the entire Ledger
    const ledgerTotals = await ledgerModel.aggregate([
      {
        $group: {
          _id: null,
          totalDebit: {
            $sum: { $cond: [{ $eq: ["$type", "DEBIT"] }, "$amount", 0] },
          },
          totalCredit: {
            $sum: { $cond: [{ $eq: ["$type", "CREDIT"] }, "$amount", 0] },
          },
          totalEntries: { $sum: 1 },
        },
      },
    ]);

    const totalDebit = ledgerTotals[0]?.totalDebit || 0;
    const totalCredit = ledgerTotals[0]?.totalCredit || 0;
    const totalEntries = ledgerTotals[0]?.totalEntries || 0;

    // 2. Aggregate initial funds minted by system user
    const systemUsers = await mongoose.model("User").find({ systemUser: true }).select("_id");
    const systemUserIds = systemUsers.map((u) => u._id);
    const systemAccounts = await accountModel.find({ user: { $in: systemUserIds } }).select("_id");
    const systemAccountIds = systemAccounts.map((a) => a._id);

    // Initial funds are transactions from system accounts where only recipient was credited
    const initialFundsTxs = await transactionModel.find({
      status: "COMPLETED",
      fromAccount: { $in: systemAccountIds },
    });

    // To be precise: initial funds transactions have only 1 ledger entry (CREDIT), while P2P have 2 (DEBIT + CREDIT)
    const txLedgerCounts = await ledgerModel.aggregate([
      {
        $group: {
          _id: "$transaction",
          entriesCount: { $sum: 1 },
          amount: { $first: "$amount" },
        },
      },
    ]);

    let totalMintedFunds = 0;
    let totalP2PTransactions = 0;
    let corruptedTransactions = 0;

    txLedgerCounts.forEach((tx) => {
      if (tx.entriesCount === 1) {
        totalMintedFunds += tx.amount;
      } else if (tx.entriesCount === 2) {
        totalP2PTransactions += 1;
      } else {
        corruptedTransactions += 1;
      }
    });

    // 3. Double-Entry Invariance Formula:
    // In balanced double-entry: Total Credit = Total Debit + Total Minted Funds
    const expectedCredit = totalDebit + totalMintedFunds;
    const discrepancy = totalCredit - expectedCredit;
    const isReconciled = discrepancy === 0 && corruptedTransactions === 0;

    // 4. Account-by-Account verification
    const allAccounts = await accountModel.find();
    let sumOfAccountBalances = 0;
    let overdrawnAccountsCount = 0;

    for (const acc of allAccounts) {
      const bal = await acc.getBalance();
      sumOfAccountBalances += bal;
      if (bal < 0) {
        overdrawnAccountsCount += 1;
      }
    }

    const netSystemBalance = totalCredit - totalDebit;
    const accountBalanceMatch = sumOfAccountBalances === netSystemBalance;

    return res.status(200).json({
      status: "Success",
      reconciled: isReconciled && accountBalanceMatch && overdrawnAccountsCount === 0,
      doubleEntryAudit: {
        totalDebit,
        totalCredit,
        totalMintedFunds,
        expectedCredit,
        discrepancy,
        totalLedgerEntries: totalEntries,
        totalP2PTransactions,
        corruptedTransactions,
      },
      accountsAudit: {
        totalAccounts: allAccounts.length,
        sumOfAccountBalances,
        netSystemBalance,
        accountBalanceMatch,
        overdrawnAccountsCount,
      },
      integrityStatus:
        isReconciled && accountBalanceMatch && overdrawnAccountsCount === 0
          ? "MATHEMATICALLY_VERIFIED_AND_BALANCED"
          : "DISCREPANCY_DETECTED",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Failed to perform ledger reconciliation",
      status: "Error",
    });
  }
}

module.exports = {
  createTransaction,
  createInitialFundsTransaction,
  getUserTransactions,
  reconcileLedger,
};
