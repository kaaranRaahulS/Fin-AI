// backend/src/models/Account.js
const mongoose = require("mongoose");

const AccountSchema = new mongoose.Schema(
	{
		user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
		holderName: { type: String }, // Name of the account holder
		ownerNames: [{ type: String }], // For joint accounts
		plaidItem: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "PlaidItem",
			required: true,
		},

		plaidAccountId: { type: String, required: true }, // Plaid account_id
		name: { type: String },
		officialName: { type: String },
		mask: { type: String },

		type: { type: String }, // "depository", "credit", etc.
		subtype: { type: String },

		currentBalance: { type: Number },
		availableBalance: { type: Number },
		isoCurrencyCode: { type: String },
		limit: { type: Number },
	},
	{ timestamps: true }
);

// one account per user+plaidAccountId
AccountSchema.index({ user: 1, plaidAccountId: 1 }, { unique: true });

module.exports = mongoose.model("Account", AccountSchema);
