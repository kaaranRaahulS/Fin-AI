// backend/src/models/PlaidAccountToken.js
const mongoose = require("mongoose");

const PlaidAccountTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one token doc per user
    },
    // Plaid Income user_token from /user/create
    plaidUserToken: {
      type: String,
      required: true,
    },
    environment: {
      type: String,
      enum: ["sandbox", "development", "production"],
      default: "sandbox",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "PlaidAccountToken",
  PlaidAccountTokenSchema
);
