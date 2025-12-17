// services/budgetService.js
const Budget = require("../models/Budget");
const mongoose = require("mongoose");

async function computeTotals(spendingCategories, savingsCategories) {
	const totalSpending = (spendingCategories || []).reduce(
		(s, c) => s + Number(c.amount || 0),
		0
	);
	const totalSavings = (savingsCategories || []).reduce(
		(s, c) => s + Number(c.amount || 0),
		0
	);
	const totalBudget = totalSpending + totalSavings;
	return { totalSpending, totalSavings, totalBudget };
}

async function getBudgetByUser(userId) {
	return Budget.findOne({ userId }).lean().exec();
}

async function createOrUpdateBudget(
	userId,
	{
		spendingCategories = [],
		savingsCategories = [],
		monthlyIncomeSnapshot = null,
		notes = "",
	}
) {
	const totals = await computeTotals(spendingCategories, savingsCategories);

	const payload = {
		userId,
		spendingCategories,
		savingsCategories,
		monthlyIncomeSnapshot,
		totalSpending: totals.totalSpending,
		totalSavings: totals.totalSavings,
		totalBudget: totals.totalBudget,
		notes,
	};

	// upsert (create or update)
	const doc = await Budget.findOneAndUpdate(
		{ userId },
		{ $set: payload },
		{ upsert: true, new: true, setDefaultsOnInsert: true }
	).exec();

	return doc;
}

async function deleteBudget(userId) {
	return Budget.findOneAndDelete({ userId }).exec();
}

module.exports = {
	computeTotals,
	getBudgetByUser,
	createOrUpdateBudget,
	deleteBudget,
};
