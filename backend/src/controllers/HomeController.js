// backend/src/controllers/HomeController.js
const PlaidItem = require("../models/PlaidItem");
const Account = require("../models/Account");
const Transaction = require("../models/Transaction");
const PlaidAccountToken = require("../models/PlaidAccountToken");
const plaidClient = require("../plaidClient");

// ---------- helpers ----------
function daysBetween(a, b) {
	const ms = b.getTime() - a.getTime();
	return ms / (1000 * 60 * 60 * 24);
}

// Detect recurring series (monthly-ish) grouped by merchant name
function detectRecurringSeries(transactions, { type, primariesFilter }) {
	const groups = {};
	const today = new Date();

	// group by merchant/name and type ("income" or "expense")
	for (const t of transactions) {
		const isIncome = t.amount < 0; // Plaid: negative = money in
		const tType = isIncome ? "income" : "expense";
		if (tType !== type) continue;

		const key = (t.merchantName || t.name || "Unknown").trim().toUpperCase();
		if (!groups[key]) groups[key] = [];
		groups[key].push(t);
	}

	const results = [];

	for (const key of Object.keys(groups)) {
		const txs = groups[key].sort(
			(a, b) => new Date(a.date) - new Date(b.date)
		);
		if (txs.length < 2) continue;

		// filter by primary category if requested
		const sample = txs[txs.length - 1];
		const primary = sample.raw?.personal_finance_category?.primary || null;
		if (
			Array.isArray(primariesFilter) &&
			primariesFilter.length &&
			!primariesFilter.includes(primary)
		) {
			continue;
		}

		// only look at last up to 3 occurrences
		const recent = txs.slice(-3);
		const amounts = recent.map((t) => Math.abs(Number(t.amount)));
		const avgAmount = amounts.reduce((s, v) => s + v, 0) / amounts.length || 0;

		if (!avgAmount) continue;

		// amounts must be within ~20%
		const maxAllowedDiff = avgAmount * 0.2;
		const amountsOk = amounts.every(
			(amt) => Math.abs(amt - avgAmount) <= maxAllowedDiff
		);
		if (!amountsOk) continue;

		// intervals
		const dates = recent.map((t) => new Date(t.date));
		const intervals = [];
		for (let i = 1; i < dates.length; i++) {
			intervals.push(daysBetween(dates[i - 1], dates[i]));
		}
		if (!intervals.length) continue;

		const avgInterval = intervals.reduce((s, v) => s + v, 0) / intervals.length;

		// treat as monthly-ish
		if (avgInterval < 25 || avgInterval > 35) continue;

		const lastDate = dates[dates.length - 1];
		let nextDate = new Date(
			lastDate.getTime() + avgInterval * 24 * 60 * 60 * 1000
		);
		if (nextDate <= today) {
			nextDate = new Date(
				nextDate.getTime() + avgInterval * 24 * 60 * 60 * 1000
			);
		}

		results.push({
			name: sample.merchantName || sample.name || "Recurring Payment",
			avgAmount: Math.round(avgAmount * 100) / 100,
			primary,
			lastDate,
			nextDate,
		});
	}

	return results;
}

// ---------- Income user token helper ----------
async function getOrCreateIncomeUserToken(userId) {
	// 1. Try to find an existing token doc
	let tokenDoc = await PlaidAccountToken.findOne({ user: userId });
	if (tokenDoc) {
		return tokenDoc.plaidUserToken;
	}

	// 2. No token yet -> create a new Plaid Income user
	const userCreateResp = await plaidClient.userCreate({
		client_user_id: String(userId), // your internal user id
	});

	const userToken = userCreateResp.data.user_token; // user-sandbox-...

	// 3. Persist it
	tokenDoc = await PlaidAccountToken.create({
		user: userId,
		plaidUserToken: userToken,
		environment: process.env.PLAID_ENV || "sandbox",
	});

	return tokenDoc.plaidUserToken;
}

// ---------- HOME DATA ----------
async function getHomeData(req, res) {
	try {
		const userId = req.query.userId || req.body.userId;

		if (!userId) {
			return res.status(400).json({ error: "Missing userId" });
		}

		// Check if user has any linked Plaid accounts
		const plaidItems = await PlaidItem.find({ user: userId });
		const hasLinkedAccounts = plaidItems.length > 0;

		let response = {
			hasLinkedAccounts,
			message: hasLinkedAccounts
				? "Account data loaded successfully"
				: "Please link your bank account to view your financial data",
		};

		if (!hasLinkedAccounts) {
			return res.json(response);
		}

		// ----- Accounts / total balance -----
		const accounts = await Account.find({ user: userId });
		const totalBalance = accounts.reduce(
			(sum, account) => sum + (account.currentBalance || 0),
			0
		);

		// ----- Transactions (we'll reuse for multiple metrics) -----
		const today = new Date();

		// use LAST 30 DAYS instead of calendar month
		const monthlyWindowStart = new Date();
		monthlyWindowStart.setDate(monthlyWindowStart.getDate() - 30);
		monthlyWindowStart.setHours(0, 0, 0, 0);

		const lookbackStart = new Date();
		lookbackStart.setDate(lookbackStart.getDate() - 120); // ~4 months

		const txLast30Days = await Transaction.find({
			user: userId,
			date: { $gte: monthlyWindowStart, $lte: today },
		}).lean();

		const txRecent = await Transaction.find({
			user: userId,
			date: { $gte: lookbackStart },
		})
			.sort({ date: 1 })
			.lean();

		// ----- Monthly income / expenses & rewards -----
		let monthlyIncome = 0;
		let monthlyExpenses = 0;
		let availableRewards = 0;
		let eligibleCardSpend = 0; // for fallback reward estimate

		const REWARD_ELIGIBLE_PRIMARIES = [
			"GENERAL_MERCHANDISE",
			"FOOD_AND_DRINK",
			"TRAVEL",
			"ENTERTAINMENT",
			"TRANSPORTATION",
		];

		for (const t of txLast30Days) {
			const amt = Number(t.amount) || 0;
			const primary = t.raw?.personal_finance_category?.primary || null;

			// Plaid: positive = money out (debit), negative = money in (credit)
			if (amt < 0) {
				monthlyIncome += Math.abs(amt);

				// look for explicit reward / cashback credits
				const name = (t.merchantName || t.name || "").toLowerCase();
				const pfc = t.raw?.personal_finance_category?.primary;
				if (
					/bonus|reward|cashback|cash back|points/i.test(name) ||
					pfc === "REWARDS"
				) {
					availableRewards += Math.abs(amt);
				}
			} else if (amt > 0) {
				monthlyExpenses += amt;

				if (primary && REWARD_ELIGIBLE_PRIMARIES.includes(primary)) {
					eligibleCardSpend += amt;
				}
			}
		}

		// if no explicit rewards, estimate ~1% of card-like spending
		if (availableRewards === 0 && eligibleCardSpend > 0) {
			availableRewards = +(eligibleCardSpend * 0.01).toFixed(2);
		}

		monthlyIncome = Math.round(monthlyIncome * 100) / 100;
		monthlyExpenses = Math.round(monthlyExpenses * 100) / 100;

		const monthlyDelta = monthlyIncome - monthlyExpenses;
		const monthlyDeltaPercentage =
			monthlyIncome > 0
				? Math.round((monthlyDelta / monthlyIncome) * 100)
				: 0;

		// ----- Recent transactions (last 5, newest first) -----
		const recentTransactions = await Transaction.find({ user: userId })
			.sort({ date: -1 })
			.limit(5)
			.populate("account", "name");

		// ----- Upcoming bills (next 7 days, recurring rent/loan) -----
		const BILL_PRIMARIES = ["RENT_AND_UTILITIES", "LOAN_PAYMENTS"];
		const allSeriesBills = detectRecurringSeries(txRecent, {
			type: "expense",
			primariesFilter: BILL_PRIMARIES,
		});

		const oneWeekAhead = new Date();
		oneWeekAhead.setDate(today.getDate() + 7);

		const upcomingBillsSeries = allSeriesBills.filter(
			(s) => s.nextDate >= today && s.nextDate <= oneWeekAhead
		);

		const upcomingBillsAmount = upcomingBillsSeries.reduce(
			(sum, s) => sum + s.avgAmount,
			0
		);

		const upcomingBills = upcomingBillsSeries.map((s) => ({
			name: s.name,
			amount: s.avgAmount,
			nextDate: s.nextDate,
			primary: s.primary,
		}));

		// ----- Active subscriptions (recurring entertainment) -----
		const SUBSCRIPTION_PRIMARIES = ["ENTERTAINMENT"];
		const subsSeries = detectRecurringSeries(txRecent, {
			type: "expense",
			primariesFilter: SUBSCRIPTION_PRIMARIES,
		});

		const activeSubscriptionsCount = subsSeries.length;
		const activeSubscriptionsTotal = subsSeries.reduce(
			(sum, s) => sum + s.avgAmount,
			0
		);
		const activeSubscriptionsNames = subsSeries.map((s) => s.name);

		// ----- Income (Plaid Bank Income via user_token) -----
		let incomeReport = null;
		try {
			const userToken = await getOrCreateIncomeUserToken(userId);

			const request = {
				user_token: userToken,
				options: { count: 1 }, // latest report
			};

			const incomeResp = await plaidClient.creditBankIncomeGet(request);
			incomeReport = incomeResp.data;
		} catch (err) {
			console.error("Income fetch failed:", err.response?.data || err);
			// don't block home data if this fails
		}
		response = {
			...response,
			totalBalance,
			monthlyIncome,
			monthlyExpenses,
			monthlyDelta,
			monthlyDeltaPercentage,
			availableRewards: Math.round(availableRewards * 100) / 100 || 0,
			recentTransactions,
			upcomingBills,
			upcomingBillsAmount:
				Math.round(upcomingBillsAmount * 100) / 100,
			upcomingBillsCount: upcomingBills.length,
			activeSubscriptionsCount,
			activeSubscriptionsTotal:
				Math.round(activeSubscriptionsTotal * 100) / 100,
			activeSubscriptionsNames,
			incomeReport,
		};

		return res.json(response);
	} catch (err) {
		console.error("Error in getHomeData:", err);
		return res.status(500).json({
			error: "Failed to load home data",
			details: err.message,
		});
	}
}

// ---------- ALL TRANSACTIONS ----------
async function getAllTransactionsForUser(req, res) {
	try {
		const userId = req.query.userId || req.body.userId;
		if (!userId) {
			return res.status(400).json({ error: "Missing userId" });
		}

		const limit = Number(req.query.limit) || 200;

		const txs = await Transaction.find({ user: userId })
			.sort({ date: -1 })
			.limit(limit)
			.lean();

		function mapCategory(tx) {
			const primary = tx.raw?.personal_finance_category?.primary;

			switch (primary) {
				case "TRANSPORTATION":
					return "Transportation";
				case "RENT_AND_UTILITIES":
					return "Rent & Utilities";
				case "PERSONAL_CARE":
					return "Personal Care";
				case "TRANSFER_OUT":
					return "Transfer Out";
				case "LOAN_PAYMENTS":
					return "Loan Payments";
				case "INCOME":
					return "Income";
				case "FOOD_AND_DRINK":
					return "Food & Drink";
				case "TRAVEL":
					return "Travel";
				case "GENERAL_MERCHANDISE":
					return "General Merchandise";
				case "ENTERTAINMENT":
					return "Entertainment";
				default:
					if (Array.isArray(tx.category) && tx.category.length > 0) {
						const raw = tx.category[0];
						return raw
							.split("_")
							.map(
								(part) =>
									part.charAt(0).toUpperCase() +
									part.slice(1).toLowerCase()
							)
							.join(" ");
					}
					return "Other";
			}
		}

		const uiTxs = txs.map((t) => {
			const isIncome = t.amount < 0;
			const absAmount = Math.abs(t.amount);
			const jsDate = new Date(t.date);

			const date = jsDate.toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
				year: "numeric",
			});

			const time = jsDate.toLocaleTimeString("en-US", {
				hour: "numeric",
				minute: "2-digit",
			});

			return {
				id: String(t._id),
				name: t.merchantName || t.name,
				category: mapCategory(t),
				amount: absAmount,
				type: isIncome ? "income" : "expense",
				date,
				time,
				dateObj: jsDate.toISOString(),
			};
		});

		return res.json({
			count: uiTxs.length,
			transactions: uiTxs,
		});
	} catch (err) {
		console.error("getAllTransactionsForUser error:", err);
		return res
			.status(500)
			.json({ error: "Failed to fetch all transactions" });
	}
}

module.exports = {
	getHomeData,
	getAllTransactionsForUser,
};
