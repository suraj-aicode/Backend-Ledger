const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");

jest.mock("../src/services/email.service", () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
}));

describe("API Endpoints & Validation Integration Tests", () => {
  let authToken = "";
  let createdAccountId = "";
  const testUser = {
    name: "Jest Test User",
    email: `jest_test_${Date.now()}@example.com`,
    password: "securepassword123",
  };

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  describe("Auth & User Flow", () => {
    it("should reject registration when validation fails", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "",
        email: "bad-email",
        password: "123",
      });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe("Failed");
      expect(res.body.errors.length).toBeGreaterThan(0);
    });

    it("should successfully register a valid user and receive JWT token", async () => {
      const res = await request(app).post("/api/auth/register").send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("Success");
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(testUser.email.toLowerCase());
      authToken = res.body.token;
    });

    it("should fetch current authenticated user profile via /api/auth/me", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("Success");
      expect(res.body.user.email).toBe(testUser.email.toLowerCase());
    });
  });

  describe("Account & Balance Flow", () => {
    it("should create a new ledger account for authenticated user", async () => {
      const res = await request(app)
        .post("/api/account/create-account")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("Success");
      expect(res.body.account._id).toBeDefined();
      createdAccountId = res.body.account._id;
    });

    it("should return 400 when fetching balance with invalid ObjectId format", async () => {
      const res = await request(app)
        .get("/api/account/balance/invalid-object-id")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(400);
      expect(res.body.status).toBe("Failed");
      expect(res.body.message).toContain("must be a valid 24-char ObjectId");
    });

    it("should fetch account balance for the created account", async () => {
      const res = await request(app)
        .get(`/api/account/balance/${createdAccountId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("Success");
      expect(typeof res.body.balance).toBe("number");
      expect(res.body.balance).toBe(0);
    });
  });
});
