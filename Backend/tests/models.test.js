const mongoose = require("mongoose");
const userModel = require("../src/models/user.model");
const accountModel = require("../src/models/account.model");
const ledgerModel = require("../src/models/ledger.model");

describe("Backend Data Models & Ledger Immutability Tests", () => {
  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  describe("User Model Password Hashing & Methods", () => {
    it("should have comparePassword method defined on user instance", async () => {
      const user = new userModel({
        name: "Test User",
        email: "test@example.com",
        password: "secretpassword123",
      });

      expect(typeof user.comparePassword).toBe("function");
    });

    it("should correctly validate password length requirement", async () => {
      const invalidUser = new userModel({
        name: "Short Pass",
        email: "short@example.com",
        password: "123",
      });

      const validationError = invalidUser.validateSync();
      expect(validationError.errors["password"]).toBeDefined();
    });
  });

  describe("Ledger Model Immutability Guard", () => {
    it("should reject updateOne operations with immutability error", async () => {
      await expect(
        ledgerModel.updateOne(
          { _id: new mongoose.Types.ObjectId() },
          { amount: 1000 }
        )
      ).rejects.toThrow("Ledger entries cannot be modified or deleted");
    });

    it("should reject deleteOne operations with immutability error", async () => {
      await expect(
        ledgerModel.deleteOne({ _id: new mongoose.Types.ObjectId() })
      ).rejects.toThrow("Ledger entries cannot be modified or deleted");
    });

    it("should reject findOneAndUpdate operations with immutability error", async () => {
      await expect(
        ledgerModel.findOneAndUpdate(
          { _id: new mongoose.Types.ObjectId() },
          { amount: 500 }
        )
      ).rejects.toThrow("Ledger entries cannot be modified or deleted");
    });
  });

  describe("Account Model Methods", () => {
    it("should have getBalance defined on account methods", () => {
      const account = new accountModel({
        user: new mongoose.Types.ObjectId(),
        currency: "INR",
        status: "ACTIVE",
      });

      expect(typeof account.getBalance).toBe("function");
    });

    it("should enforce ACTIVE status by default", () => {
      const account = new accountModel({
        user: new mongoose.Types.ObjectId(),
      });

      expect(account.status).toBe("ACTIVE");
      expect(account.currency).toBe("INR");
    });
  });
});
