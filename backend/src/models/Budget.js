// models/Budget.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const CategorySchema = new Schema(
	{
		name: { type: String, required: true }, // use enum
		amount: { type: Number, required: true, default: 0 },
	},
	{ _id: false }
);

const BudgetSchema = new Schema(
	{
		userId: {
			type: Schema.Types.ObjectId,
			required: true,
			index: true,
			ref: "User",
		},
		// snapshot of monthly income at time of saving (optional)
		monthlyIncomeSnapshot: { type: Number, default: null },

		// spending and saving categories are arrays of CategorySchema
		spendingCategories: { type: [CategorySchema], default: [] },
		savingsCategories: { type: [CategorySchema], default: [] },

		// totals and derived fields cached for quick reads
		totalSpending: { type: Number, default: 0 },
		totalSavings: { type: Number, default: 0 },
		totalBudget: { type: Number, default: 0 },

		// any metadata
		notes: { type: String, default: "" },
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Budget", BudgetSchema);
