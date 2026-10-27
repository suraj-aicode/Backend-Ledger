const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  fromAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account",
    required: [true, "Transcaton must be associated with form account"],
    index: true,
  },
  toAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account",
    required: [true, "Transcaton must be associated with to account"],
    index: true,
  },
  status: {
    type: String,
    enum: {
      values: ["PENDING", "COMPLETED", "FAILED", "REVERSED"],
      message: "Status must be either PENDING, COMPLETED, FAILED, or REVERSED",
    },
    default: "PENDING",
    },
    amount: {
        type: Number,
        required : [true, "Transaction amount is required"],
        min: [0, "Transaction amount must be greater than or equal to 0"],
    },
    idempotencyKey: {
        type: String,
        required: [true, "Idempotency key is required"],
        unique: true,
        index: true,
        alias: "itempotencyKey",
    }
},
{timestamps: true});


const transactionModel = mongoose.model("Transaction", transactionSchema);

module.exports = transactionModel;