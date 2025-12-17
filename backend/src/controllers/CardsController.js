const Account = require("../models/Account");
const Transaction = require("../models/Transaction");

/**
 * Get all cards/accounts for a user with their details
 */
async function getCardsData(req, res) {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        // Get all accounts for the user
        const accounts = await Account.find({ user: userId })
            .sort({ name: 1 }) // Sort by account name
            .lean(); // Convert to plain JS object

        if (!accounts || accounts.length === 0) {
            return res.json({
                success: true,
                message: "No accounts found",
                accounts: []
            });
        }

        // Get recent transactions for reward calculations
        const recentTransactions = await Transaction.find({
            user: userId,
            date: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 3)) } // Last 3 months
        }).sort({ date: -1 });

        // Calculate rewards and spending by category
        const categorySpending = {};
        let totalSpent = 0;

        recentTransactions.forEach(tx => {
            const amount = Math.abs(tx.amount);
            totalSpent += amount;

            tx.category?.forEach(cat => {
                if (!categorySpending[cat]) {
                    categorySpending[cat] = 0;
                }
                categorySpending[cat] += amount;
            });
        });

        // Sort categories by spending amount
        const sortedCategories = Object.entries(categorySpending)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5) // Top 5 categories
            .map(([category, amount]) => ({
                category,
                amount,
                percentage: Math.round((amount / totalSpent) * 100)
            }));

        // Format accounts with additional data
        const formattedAccounts = accounts.map(account => {
            // Calculate utilization if it's a credit card
            const utilization = account.type === 'credit' && account.limit > 0
                ? (account.currentBalance / account.limit) * 100
                : null;

            return {
                id: account._id,
                name: account.name,
                last4: account.mask || '••••',
                currentBalance: account.currentBalance,
                availableBalance: account.availableBalance,
                limit: account.limit,
                type: account.type,
                subtype: account.subtype,
                isoCurrencyCode: account.isoCurrencyCode || 'USD',
                utilization: utilization ? Math.round(utilization) : null,
                // Add mock rewards data (replace with actual rewards calculation if available)
                rewards: {
                    points: Math.floor(Math.random() * 5000) + 1000,
                    cashback: (Math.random() * 50 + 10).toFixed(2)
                }
            };
        });

        return res.json({
            success: true,
            accounts: formattedAccounts,
            spendingInsights: {
                topCategories: sortedCategories,
                totalSpent,
                startDate: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString(),
                endDate: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Error fetching cards data:', error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch cards data"
        });
    }
}

async function deleteCard(req, res) {
    try {
        const { userId, cardId } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, error: "Missing userId" });
        }

        if (!cardId) {
            return res.status(400).json({ success: false, error: "Missing cardId" });
        }

        // Make sure this account belongs to the user
        const account = await Account.findOne({ _id: cardId, user: userId });

        if (!account) {
            return res
                .status(404)
                .json({ success: false, error: "Card not found for this user" });
        }

        // Delete all transactions tied to this account (optional but usually desired)
        await Transaction.deleteMany({ user: userId, account: account._id });

        // Delete the account itself
        await Account.deleteOne({ _id: account._id });

        return res.json({
            success: true,
            message: "Card deleted successfully",
            deletedAccountId: cardId,
        });
    } catch (err) {
        console.error("deleteCard error:", err);
        return res
            .status(500)
            .json({ success: false, error: "Failed to delete card" });
    }
}


module.exports = {
    getCardsData,
    deleteCard
};
