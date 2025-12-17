// backend/src/models/Transaction.js
const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },

    plaidTransactionId: { type: String, required: true, unique: true },

    name: { type: String },
    merchantName: { type: String },
    amount: { type: Number, required: true },
    isoCurrencyCode: { type: String },
    date: { type: Date },

    category: [String],
    pending: { type: Boolean },
    paymentChannel: { type: String }, // "online", "in store", etc.

    raw: { type: Object }, // full Plaid transaction object (optional)
  },
  { timestamps: true }
);

// for fast queries "latest transactions for user"
TransactionSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model("Transaction", TransactionSchema);
