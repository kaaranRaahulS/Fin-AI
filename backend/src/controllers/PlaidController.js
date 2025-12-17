// backend/src/controllers/plaidController.js
const plaidClient = require("../plaidClient");
const PlaidItem = require("../models/PlaidItem");
const Account = require("../models/Account");
const Transaction = require("../models/Transaction");

async function createLinkToken(req, res) {
	try {
		const { userId } = req.body;
		if (!userId) return res.status(400).json({ error: "Missing userId" });

		const response = await plaidClient.linkTokenCreate({
			user: { client_user_id: String(userId) },
			client_name: "Fin-AI",
			products: ["transactions", "identity", "auth"],
			country_codes: ["US"],
			language: "en",
		});

		return res.json(response.data);
	} catch (err) {
		console.error("createLinkToken error:", err?.response?.data ?? err);
		return res.status(500).json({ error: "Failed to create link token" });
	}
}

async function exchangePublicToken(req, res) {
	try {
		const { userId, publicToken, institution } = req.body;
		if (!userId) return res.status(400).json({ error: "Missing userId" });
		if (!publicToken)
			return res.status(400).json({ error: "Missing publicToken" });

		const { data } = await plaidClient.itemPublicTokenExchange({
			public_token: publicToken,
		});
		const { access_token, item_id } = data;

		let plaidItem = await PlaidItem.findOne({ itemId: item_id, user: userId });

		if (!plaidItem) {
			plaidItem = await PlaidItem.create({
				user: userId,
				itemId: item_id,
				accessToken: access_token,
				institutionId: institution?.institution_id,
				institutionName: institution?.name,
			});
		} else {
			plaidItem.accessToken = access_token;
			if (institution) {
				plaidItem.institutionId = institution.institution_id;
				plaidItem.institutionName = institution.name;
			}
			await plaidItem.save();
		}

		// 1) Get accounts (balances)
		const accountsResp = await plaidClient.accountsGet({
			access_token: access_token,
		});
		const accounts = accountsResp.data.accounts;

		// 2) Get identity owners / verification_name
		const infoByAccountId = {};
		try {
			const identityResp = await plaidClient.identityGet({
				access_token: access_token,
			});

			identityResp.data.accounts.forEach((acc) => {
				const ownerNames =
					acc.owners?.flatMap((o) => o.names || [])?.filter(Boolean) || [];
				const verificationName = acc.verification_name || null;

				infoByAccountId[acc.account_id] = {
					ownerNames,
					verificationName,
				};
			});
		} catch (e) {
			// Identity not available for this FI or product not enabled
			console.error(
				"identityGet error (owner/verification name may be empty):",
				e.response?.data || e
			);
		}

		const accountDocs = [];
		for (const acc of accounts) {
			const identityInfo = infoByAccountId[acc.account_id] || {};
			const ownerNames = identityInfo.ownerNames || [];
			const verificationName = identityInfo.verificationName || null;

			const holderName =
				ownerNames[0] || // first owner from Identity
				verificationName || // or verification_name from Auth flows
				""; // or empty string if nothing

			const doc = await Account.findOneAndUpdate(
				{
					user: userId,
					plaidItem: plaidItem._id,
					plaidAccountId: acc.account_id,
				},
				{
					name: acc.name,
					officialName: acc.official_name,
					mask: acc.mask,
					type: acc.type,
					subtype: acc.subtype,
					currentBalance: acc.balances.current,
					availableBalance: acc.balances.available,
					isoCurrencyCode: acc.balances.iso_currency_code,
					limit: acc.balances.limit,
					holderName,
					ownerNames,
					verificationName,
				},
				{ new: true, upsert: true }
			);

			accountDocs.push(doc);
		}

		return res.json({
			plaidItemId: plaidItem._id,
			institutionName: plaidItem.institutionName,
			accounts: accountDocs,
		});
	} catch (err) {
		console.error("exchangePublicToken error:", err?.response?.data ?? err);
		return res.status(500).json({ error: "Failed to exchange public token" });
	}
}

// syncTransactions / getTransactions unchanged...
async function syncTransactions(req, res) {
	try {
		const { userId, plaidItemId, start_date, end_date } = req.body;
		if (!userId) return res.status(400).json({ error: "Missing userId" });
		if (!plaidItemId)
			return res.status(400).json({ error: "Missing plaidItemId" });

		const item = await PlaidItem.findOne({
			_id: plaidItemId,
			user: userId,
		});
		if (!item) return res.status(404).json({ error: "Plaid item not found" });

		const today = new Date().toISOString().slice(0, 10);
		const startDate = start_date || "2025-05-01";
		const endDate = end_date || today;

		console.log(
			"Syncing transactions for item",
			plaidItemId,
			"from",
			startDate,
			"to",
			endDate
		);

		const plaidResp = await plaidClient.transactionsGet({
			access_token: item.accessToken,
			start_date: startDate,
			end_date: endDate,
			options: { count: 500, offset: 0 },
		});

		const { transactions } = plaidResp.data;

		const plaidAccountIds = [...new Set(transactions.map((t) => t.account_id))];

		const accounts = await Account.find({
			user: userId,
			plaidItem: item._id,
			plaidAccountId: { $in: plaidAccountIds },
		});

		const accountMap = {};
		accounts.forEach((acc) => {
			accountMap[acc.plaidAccountId] = acc;
		});

		const savedTxs = [];
		for (const t of transactions) {
			const account = accountMap[t.account_id];
			if (!account) continue;

			const doc = await Transaction.findOneAndUpdate(
				{ plaidTransactionId: t.transaction_id },
				{
					user: userId,
					account: account._id,
					name: t.name,
					merchantName: t.merchant_name,
					amount: t.amount,
					isoCurrencyCode: t.iso_currency_code,
					date: t.date,
					category: t.category || [],
					pending: t.pending,
					paymentChannel: t.payment_channel,
					raw: t,
				},
				{ new: true, upsert: true }
			);
			savedTxs.push(doc);
		}


		return res.json({
			count: savedTxs.length,
			transactions: savedTxs,
		});
	} catch (err) {
		console.error("syncTransactions error:", err?.response?.data ?? err);
		return res.status(500).json({ error: "Failed to sync transactions" });
	}
}

async function getTransactions(req, res) {
	try {
		const userId = req.query.userId || req.body.userId;
		if (!userId) return res.status(400).json({ error: "Missing userId" });

		const { accountId, from, to, limit = 100 } = req.query;
		const query = { user: userId };

		if (accountId) query.account = accountId;
		if (from || to) {
			query.date = {};
			if (from) query.date.$gte = new Date(from);
			if (to) query.date.$lte = new Date(to);
		}

		const txs = await Transaction.find(query)
			.sort({ date: -1 })
			.limit(Number(limit))
			.populate("account");

		return res.json(txs);
	} catch (err) {
		console.error("getTransactions error:", err);
		return res.status(500).json({ error: "Failed to fetch transactions" });
	}
}

module.exports = {
	createLinkToken,
	exchangePublicToken,
	syncTransactions,
	getTransactions,
};
