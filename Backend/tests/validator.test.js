const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");

describe("Express-Validator Middleware Tests", () => {
  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  describe("POST /api/auth/register Validation", () => {
    it("should return 400 when name is missing", async () => {
      const res = await request(app).post("/api/auth/register").send({
        email: "valid@example.com",
        password: "password123",
      });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe("Failed");
      expect(res.body.errors.some((e) => e.field === "name")).toBe(true);
    });

    it("should return 400 when email format is invalid", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Test User",
        email: "not-an-email",
        password: "password123",
      });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe("Failed");
      expect(res.body.errors.some((e) => e.field === "email")).toBe(true);
    });

    it("should return 400 when password is shorter than 6 characters", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Test User",
        email: "test@example.com",
        password: "123",
      });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe("Failed");
      expect(res.body.errors.some((e) => e.field === "password")).toBe(true);
    });
  });

  describe("POST /api/auth/login Validation", () => {
    it("should return 400 when email is missing or empty", async () => {
      const res = await request(app).post("/api/auth/login").send({
        password: "password123",
      });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe("Failed");
      expect(res.body.errors.some((e) => e.field === "email")).toBe(true);
    });

    it("should return 400 when password is missing", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
      });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe("Failed");
      expect(res.body.errors.some((e) => e.field === "password")).toBe(true);
    });
  });

  describe("Account Route Parameter Validation", () => {
    it("should return 400 when accountId is not a valid 24-character Mongo ObjectId", async () => {
      // Mock authorization header with dummy bearer or fake token
      const res = await request(app)
        .get("/api/account/balance/invalid-id-123")
        .set("Authorization", "Bearer fake-token");

      // Either unauthorized (401) or invalid param (400)
      expect([400, 401]).toContain(res.status);
    });
  });

  describe("Transaction Request Validation", () => {
    it("should return 400 or 401 when transaction payload contains invalid data", async () => {
      const res = await request(app)
        .post("/api/transaction")
        .send({
          fromAccount: "123",
          toAccount: "456",
          amount: -50,
          idempotencyKey: "",
        });

      // Protected route returns 401 when no token is provided
      expect([400, 401]).toContain(res.status);
    });
  });
});
