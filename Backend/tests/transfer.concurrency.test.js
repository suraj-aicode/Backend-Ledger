const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const accountModel = require("../src/models/account.model");
const ledgerModel = require("../src/models/ledger.model");

// Mock email service to prevent open network handles and accelerate test execution
jest.mock("../src/services/email.service", () => ({
  sendTransactionEmail: jest.fn().mockResolvedValue(true),
  sendRegistrationEmail: jest.fn().mockResolvedValue(true),
  sendTransactionFailureEmail: jest.fn().mockResolvedValue(true),
}));

describe("Transfer Logic, Concurrency & Reconciliation Test Suite", () => {
  let tokenA = "";
  let tokenB = "";
  let accountIdA = "";
  let accountIdB = "";

  const userA = {
    name: "Sender Alice",
    email: `alice_${Date.now()}@concurrency.test`,
    password: "password123",
  };

  const userB = {
    name: "Receiver Bob",
    email: `bob_${Date.now()}@concurrency.test`,
    password: "password123",
  };

  beforeAll(async () => {
    // 1. Register User A
    const resA = await request(app).post("/api/auth/register").send(userA);
    tokenA = resA.body.token;

    // 2. Register User B
    const resB = await request(app).post("/api/auth/register").send(userB);
    tokenB = resB.body.token;

    // 3. Create Account for User A
    const accResA = await request(app)
      .post("/api/account/create-account")
      .set("Authorization", `Bearer ${tokenA}`);
    accountIdA = accResA.body.account._id;

    // 4. Create Account for User B
    const accResB = await request(app)
      .post("/api/account/create-account")
      .set("Authorization", `Bearer ${tokenB}`);
    accountIdB = accResB.body.account._id;

    // 5. Seed initial funds into Account A (₹1,000)
    await request(app)
      .post("/api/transaction/system/initiate-funds")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        toAccount: accountIdA,
        amount: 1000,
        idempotencyKey: `seed_funds_${Date.now()}`,
      });
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  describe("1. Baseline Balances", () => {
    it("should have initial balance of ₹1,000 for Account A and ₹0 for Account B", async () => {
      const resA = await request(app)
        .get(`/api/account/balance/${accountIdA}`)
        .set("Authorization", `Bearer ${tokenA}`);
      const resB = await request(app)
        .get(`/api/account/balance/${accountIdB}`)
        .set("Authorization", `Bearer ${tokenB}`);

      expect(resA.body.balance).toBe(1000);
      expect(resB.body.balance).toBe(0);
    });
  });

  describe("2. Idempotency Protection", () => {
    const fixedIdempotencyKey = `idemp_${Date.now()}`;

    it("should process the transfer on first submission", async () => {
      const res = await request(app)
        .post("/api/transaction")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          fromAccount: accountIdA,
          toAccount: accountIdB,
          amount: 100,
          idempotencyKey: fixedIdempotencyKey,
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("Success");
      expect(res.body.transaction.status).toBe("COMPLETED");
    });

    it("should reject duplicate transfer with same idempotency key (HTTP 409)", async () => {
      const res = await request(app)
        .post("/api/transaction")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          fromAccount: accountIdA,
          toAccount: accountIdB,
          amount: 100,
          idempotencyKey: fixedIdempotencyKey,
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/already completed|duplicate/i);
    });

    it("should confirm balances reflect exactly one transfer (A: ₹900, B: ₹100)", async () => {
      const resA = await request(app)
        .get(`/api/account/balance/${accountIdA}`)
        .set("Authorization", `Bearer ${tokenA}`);
      const resB = await request(app)
        .get(`/api/account/balance/${accountIdB}`)
        .set("Authorization", `Bearer ${tokenB}`);

      expect(resA.body.balance).toBe(900);
      expect(resB.body.balance).toBe(100);
    });
  });

  describe("3. Insufficient Balance Guard", () => {
    it("should reject transfer when amount exceeds current balance", async () => {
      const res = await request(app)
        .post("/api/transaction")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          fromAccount: accountIdA,
          toAccount: accountIdB,
          amount: 5000, // Available is only 900
          idempotencyKey: `overdraft_try_${Date.now()}`,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Insufficient balance/i);
    });

    it("should ensure balances were untouched after failed transfer", async () => {
      const resA = await request(app)
        .get(`/api/account/balance/${accountIdA}`)
        .set("Authorization", `Bearer ${tokenA}`);
      expect(resA.body.balance).toBe(900);
    });
  });

  describe("4. Rollback On Failure Guarantee", () => {
    it("should rollback completely and leave no orphaned ledger records if recipient is invalid", async () => {
      const ledgersBefore = await ledgerModel.countDocuments();

      const fakeTargetId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post("/api/transaction")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          fromAccount: accountIdA,
          toAccount: fakeTargetId,
          amount: 100,
          idempotencyKey: `fail_tx_${Date.now()}`,
        });

      expect([400, 404]).toContain(res.status);

      const ledgersAfter = await ledgerModel.countDocuments();
      // Verifies that neither debit nor credit were left in database
      expect(ledgersAfter).toBe(ledgersBefore);
    });
  });

  describe("5. High-Concurrency & Race-Condition Test (50 Simultaneous Transfers)", () => {
    it("should fire 50 concurrent transfers and guarantee account never overdraws", async () => {
      // Account A currently has ₹900.
      // We fire 50 concurrent requests of ₹50 each (Total requested = ₹2,500).
      // Exactly 18 transfers of ₹50 can succeed (18 * 50 = ₹900).
      // The remaining 32 transfers MUST fail (insufficient balance or conflict).
      const CONCURRENT_REQUESTS = 50;
      const TRANSFER_AMOUNT = 50;

      const promises = Array.from({ length: CONCURRENT_REQUESTS }, (_, idx) => {
        return request(app)
          .post("/api/transaction")
          .set("Authorization", `Bearer ${tokenA}`)
          .send({
            fromAccount: accountIdA,
            toAccount: accountIdB,
            amount: TRANSFER_AMOUNT,
            idempotencyKey: `concurrent_burst_${idx}_${Date.now()}_${Math.random()}`,
          });
      });

      const responses = await Promise.all(promises);

      const successfulTransfers = responses.filter((r) => r.status === 201);
      const failedTransfers = responses.filter((r) => r.status === 400 || r.status === 409);

      // Verify that total responses equal total dispatched
      expect(successfulTransfers.length + failedTransfers.length).toBe(CONCURRENT_REQUESTS);

      // Check final balances via API
      const resFinalA = await request(app)
        .get(`/api/account/balance/${accountIdA}`)
        .set("Authorization", `Bearer ${tokenA}`);
      const resFinalB = await request(app)
        .get(`/api/account/balance/${accountIdB}`)
        .set("Authorization", `Bearer ${tokenB}`);

      const finalBalanceA = resFinalA.body.balance;
      const finalBalanceB = resFinalB.body.balance;

      // CRITICAL INVARIANCE: Account A can NEVER be negative!
      expect(finalBalanceA).toBeGreaterThanOrEqual(0);

      // The money deducted from A must exactly equal money added to B
      const totalSent = successfulTransfers.length * TRANSFER_AMOUNT;
      expect(finalBalanceA).toBe(900 - totalSent);
      expect(finalBalanceB).toBe(100 + totalSent);

      // If exactly 18 succeeded, final balance is exactly 0
      expect(successfulTransfers.length).toBeLessThanOrEqual(18);
    }, 30000);
  });

  describe("6. Ledger Reconciliation Endpoint", () => {
    it("should mathematically verify double-entry balance and audit across the ledger", async () => {
      const res = await request(app)
        .get("/api/transaction/reconciliation")
        .set("Authorization", `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("Success");
      expect(res.body.reconciled).toBe(true);

      // Verify mathematical balance invariance
      const audit = res.body.doubleEntryAudit;
      expect(audit.discrepancy).toBe(0);
      expect(audit.corruptedTransactions).toBe(0);
      expect(audit.totalCredit).toBe(audit.totalDebit + audit.totalMintedFunds);

      // Verify account audit
      const accountsAudit = res.body.accountsAudit;
      expect(accountsAudit.overdrawnAccountsCount).toBe(0);
      expect(accountsAudit.accountBalanceMatch).toBe(true);
      expect(res.body.integrityStatus).toBe("MATHEMATICALLY_VERIFIED_AND_BALANCED");
    });
  });
});
