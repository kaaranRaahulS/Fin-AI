// backend/src/models/PlaidItem.js
const mongoose = require("mongoose");

const PlaidItemSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    itemId: { type: String, required: true, unique: true }, // Plaid item_id
    accessToken: { type: String, required: true }, // encrypt in production

    institutionId: { type: String },
    institutionName: { type: String },

    // for /transactions/sync later if you use it
    transactionsCursor: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PlaidItem", PlaidItemSchema);
