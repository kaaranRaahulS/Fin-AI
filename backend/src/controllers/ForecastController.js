// backend/src/controllers/forecastController.js
const Transaction = require("../models/Transaction");

const LOOKBACK_DAYS = 90;       // analyze last ~3 months
const FORECAST_WINDOW_DAYS = 45; // only show items within next 45 days

// Colors match your front-end pie chart
const CATEGORY_COLORS = {
    Transportation: "#3B82F6",
    Groceries: "#10B981",
    Bills: "#F59E0B",
    Subscriptions: "#8B5CF6",
    Shopping: "#EC4899",
    Other: "#9CA3AF",
};

// Map Plaid primary PFC -> chart category label
function mapPrimaryToChartCategory(primary, name = "") {
    switch (primary) {
        case "TRANSPORTATION":
        case "TRAVEL":
            return "Transportation";

        case "FOOD_AND_DRINK":
            return "Groceries";

        case "RENT_AND_UTILITIES":
            return "Bills";

        case "ENTERTAINMENT":
            // very rough heuristic: streaming subscriptions look like subscriptions
            if (
                /netflix|spotify|hulu|prime|apple music|youtube/i.test(name || "")
            ) {
                return "Subscriptions";
            }
            return "Shopping";

        case "GENERAL_MERCHANDISE":
            return "Shopping";

        default:
            return "Other";
    }
}

// Map Plaid primary PFC -> pretty label for upcoming expenses
function mapPrimaryToPretty(primary) {
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
            return "Other";
    }
}

// simple helper
function daysBetween(a, b) {
    const ms = b.getTime() - a.getTime();
    return ms / (1000 * 60 * 60 * 24);
}

// detect recurring transactions (monthly-ish) & forecast next one
// detect recurring transactions (monthly-ish) & forecast next one
function detectRecurringTransactions(transactions, { type }) {
    const today = new Date();
    const groups = {};

    // --- 1) group by merchant/name and direction ---
    for (const t of transactions) {
        // We'll treat amount > 0 as money OUT (expense), < 0 as money IN (income).
        // If your bank is reversed, flip this logic.
        const isExpense = t.amount > 0;
        const tType = isExpense ? "expense" : "income";

        if (tType !== type) continue;

        const key = `${t.merchantName || t.name || "Unknown"}|${tType}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(t);
    }

    const results = [];

    for (const key of Object.keys(groups)) {
        const txs = groups[key].sort(
            (a, b) => new Date(a.date) - new Date(b.date)
        );
        if (txs.length < 2) continue;

        // look only at the last up to 3 occurrences
        const recent = txs.slice(-3);
        const amounts = recent.map((t) => Math.abs(t.amount));
        const avgAmount =
            amounts.reduce((s, x) => s + x, 0) / amounts.length;

        // amounts must be within ~25% of each other (slightly looser than before)
        const maxAllowedDiff = avgAmount * 0.25;
        const amountsOk = amounts.every(
            (amt) => Math.abs(amt - avgAmount) <= maxAllowedDiff
        );
        if (!amountsOk) continue;

        // intervals between payments
        const dates = recent.map((t) => new Date(t.date));
        const intervals = [];
        for (let i = 1; i < dates.length; i++) {
            intervals.push(daysBetween(dates[i - 1], dates[i]));
        }
        if (intervals.length === 0) continue;

        const avgInterval =
            intervals.reduce((s, x) => s + x, 0) / intervals.length;

        // treat as monthly-ish (20–40 days, slightly looser so rent is not missed)
        if (avgInterval < 20 || avgInterval > 40) continue;

        const lastDate = dates[dates.length - 1];
        let nextDate = new Date(
            lastDate.getTime() + avgInterval * 24 * 60 * 60 * 1000
        );

        // if nextDate already passed, bump by another interval
        if (nextDate <= today) {
            nextDate = new Date(
                nextDate.getTime() + avgInterval * 24 * 60 * 60 * 1000
            );
        }

        const daysAhead = daysBetween(today, nextDate);
        if (daysAhead < 0 || daysAhead > FORECAST_WINDOW_DAYS) continue;

        const sample = recent[recent.length - 1];
        const primary =
            sample.raw?.personal_finance_category?.primary || null;

        // --- 2) Category gating so only “bill-ish” things appear as upcoming expenses ---
        if (type === "expense") {
            const allowedExpensePrimaries = new Set([
                "RENT_AND_UTILITIES",  // rent, electricity, etc
                "LOAN_PAYMENTS",       // credit card / loan
                "TRANSFER_OUT",        // transfers out (often card payments)
                "ENTERTAINMENT",       // Netflix / Spotify etc
                "GENERAL_MERCHANDISE", // some stores acting as subscriptions
            ]);

            // If category not clearly “bill-ish”, skip it
            if (!allowedExpensePrimaries.has(primary)) {
                // small exception: obvious subscription / bill keywords
                const name = (sample.merchantName || sample.name || "").toLowerCase();
                const isObviousRecurring =
                    /rent|mortgage|insurance|subscription|netflix|spotify|hulu|prime|apple music|youtube|loan|credit card|payment/i.test(
                        name
                    );
                if (!isObviousRecurring) continue;
            }
        }

        if (type === "income") {
            // For income, we only want things tagged as INCOME
            if (primary !== "INCOME") continue;
        }

        results.push({
            name: sample.merchantName || sample.name || "Recurring Payment",
            avgAmount: Math.round(avgAmount * 100) / 100,
            nextDate,
            prettyCategory: mapPrimaryToPretty(primary),
        });
    }

    return results;
}

// GET /api/forecast?userId=...
async function getForecast(req, res) {
    try {
        const userId = req.query.userId || req.body.userId;
        if (!userId) {
            return res.status(400).json({ error: "Missing userId" });
        }

        const today = new Date();
        const start = new Date();
        start.setDate(start.getDate() - LOOKBACK_DAYS);
        start.setHours(0, 0, 0, 0);

        const txs = await Transaction.find({
            user: userId,
            date: { $gte: start },
        })
            .sort({ date: 1 })
            .lean();

        // 1) Spending by category (expenses only, chart-style categories)
        const categoryTotals = {};
        for (const t of txs) {
            // Plaid: positive = money out, negative = money in
            if (t.amount <= 0) continue; // skip income/credits for spending chart

            const primary = t.raw?.personal_finance_category?.primary || null;
            const chartCat = mapPrimaryToChartCategory(
                primary,
                t.merchantName || t.name
            );
            if (!categoryTotals[chartCat]) categoryTotals[chartCat] = 0;
            categoryTotals[chartCat] += t.amount;
        }

        const spendingByCategory = Object.entries(categoryTotals).map(
            ([name, value]) => ({
                name,
                value: Math.round(value * 100) / 100,
                color: CATEGORY_COLORS[name] || CATEGORY_COLORS.Other,
            })
        );

        // 2) Recurring expenses & income (based on last 2–3 months)
        const recurringExpenses = detectRecurringTransactions(txs, {
            type: "expense",
        });
        const recurringIncome = detectRecurringTransactions(txs, {
            type: "income",
        });

        // format for frontend

        const upcomingExpenses = recurringExpenses
            .sort((a, b) => a.nextDate - b.nextDate)
            .map((r) => ({
                name: r.name,
                amount: Math.round(r.avgAmount * 100) / 100,
                date: r.nextDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                }), // "Nov 15"
                category: r.prettyCategory,
            }));

        const upcomingIncome = recurringIncome
            .sort((a, b) => a.nextDate - b.nextDate)
            .map((r) => ({
                name: r.name,
                amount: Math.round(r.avgAmount * 100) / 100,
                date: r.nextDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                }),
            }));

        return res.json({
            spendingByCategory,
            upcomingExpenses,
            upcomingIncome,
        });
    } catch (err) {
        console.error("getForecast error:", err);
        return res
            .status(500)
            .json({ error: "Failed to build financial forecast" });
    }
}

module.exports = {
    getForecast,
};
