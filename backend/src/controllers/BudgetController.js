// controllers/budgetController.js
const budgetService = require("../services/BudgetService");

async function getBudget(req, res) {
	try {
		const userId = req.params.userId; // replace with req.user.id if you have auth
		if (!userId)
			return res.status(404).json({ ok: false, message: "User ID required" });
		const budget = await budgetService.getBudgetByUser(userId);
		if (!budget) {
			return res.status(404).json({ ok: false, message: "Budget not found" });
		}
		return res.json({ ok: true, data: budget });
	} catch (err) {
		console.error("getBudget error", err);
		return res
			.status(500)
			.json({ ok: false, message: "Internal server error" });
	}
}

/**
 * Save or update a budget for user.
 * Body expected:
 * {
 *   spendingCategories: [{ key, name, amount }],
 *   savingsCategories: [{ key, name, amount }],
 *   monthlyIncomeSnapshot: 4500,  // optional
 *   notes: ''
 * }
 */
async function saveBudget(req, res) {
	try {
		const userId = req.params.userId;
		const {
			spendingCategories,
			savingsCategories,
			monthlyIncomeSnapshot,
			notes,
		} = req.body;

		// Basic validation
		if (
			!Array.isArray(spendingCategories) ||
			!Array.isArray(savingsCategories)
		) {
			return res
				.status(400)
				.json({ ok: false, message: "Categories must be arrays" });
		}

		// If no monthlyIncomeSnapshot provided, try to get latest income
		let incomeSnapshot = monthlyIncomeSnapshot;
		if (incomeSnapshot == null) {
			const latest = await incomeService.getLatestIncome(userId);
			incomeSnapshot = latest ? latest.amount : null;
		}

		const doc = await budgetService.createOrUpdateBudget(userId, {
			spendingCategories,
			savingsCategories,
			monthlyIncomeSnapshot: incomeSnapshot,
			notes,
		});

		return res.json({ ok: true, data: doc });
	} catch (err) {
		console.error("saveBudget error", err);
		return res
			.status(500)
			.json({ ok: false, message: "Internal server error" });
	}
}

async function deleteBudget(req, res) {
	try {
		const userId = req.params.userId;
		await budgetService.deleteBudget(userId);
		return res.json({ ok: true, message: "Budget deleted" });
	} catch (err) {
		console.error("deleteBudget error", err);
		return res
			.status(500)
			.json({ ok: false, message: "Internal server error" });
	}
}

module.exports = {
	getBudget,
	saveBudget,
	deleteBudget,
};
