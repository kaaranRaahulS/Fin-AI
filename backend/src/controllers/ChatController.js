// src/controllers/ChatController.js
const Transaction = require("../models/Transaction");
const { computeBudgetFromTransactions } = require("../../utils/budgetUtils");
const { callOllama } = require("../services/ollamaService");
const budgetService = require("../services/BudgetService");

// helper: turn category keys into nice names
function prettyName(key) {
  if (!key) return "Other";
  // handle things like 'RENT_AND_UTILITIES', 'food_and_drink', etc.
  return String(key)
    .replace(/\./g, " ")
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

async function chatHandler(req, res) {
  try {
    const { userId, message, monthlyIncome, savingsTargetPct } = req.body;
    if (!message) return res.status(400).json({ error: "message required" });

    const lower = message.toLowerCase();

    // 1️⃣ Detect "confirmation" like: "set my budget", "apply this", "as suggested above"
    const isBudgetConfirmation =
      /(set|apply|save|use|update).*(budget|this|it)/.test(lower) ||
      /(yes|okay|ok|sure).*(budget)/.test(lower) ||
      /as suggested above/.test(lower);

    // 2️⃣ Detect general budget / spending intent
    const isBudgetIntent = [
      "budget",
      "spend",
      "spending",
      "save",
      "savings",
      "expense",
      "expenses",
    ].some((k) => lower.includes(k));

    // -------------------------
    // A. USER CONFIRMS BUDGET
    // -------------------------
    if (isBudgetConfirmation) {
      if (!userId) {
        return res
          .status(400)
          .json({ error: "userId required to set a budget" });
      }

      // use last ~6 months of txns to compute same budget as before
      const txns = await Transaction.find({ user: userId }).lean();

      const budgetData = computeBudgetFromTransactions(txns, {
        monthlyIncome,
        savingsTargetPct,
      });

      // Build spending categories from monthly averages (top 8)
      const spendingCategories = Object.entries(
        budgetData.monthlyAverages || {}
      )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([key, amount]) => ({
          key,
          name: prettyName(key),
          amount: Number(Number(amount).toFixed(2)),
        }));

      // Very simple savings category: emergency fund target
      const emergencyTarget =
        budgetData?.suggestions?.rules?.emergencyFundTarget || 0;

      const savingsCategories = emergencyTarget
        ? [
          {
            key: "emergency_fund",
            name: "Emergency Fund",
            amount: Number(Number(emergencyTarget).toFixed(2)),
          },
        ]
        : [];

      const incomeSnapshot =
        budgetData?.suggestions?.recommended?.monthlyIncome ??
        (typeof monthlyIncome === "number" ? monthlyIncome : null);

      await budgetService.createOrUpdateBudget(userId, {
        spendingCategories,
        savingsCategories,
        monthlyIncomeSnapshot: incomeSnapshot,
        notes: "Created/updated via chat confirmation",
      });

      // short confirmation-style reply (no long analysis)
      const confirmPrompt = `
You are Fin-AI, a friendly finance assistant.

The user has just CONFIRMED that they want to APPLY the suggested budget.
We have already saved the budget in the database.

Reply with:
- A brief confirmation that their budget has been saved
- One short sentence about what the budget is based on (recent spending)
- One short sentence telling them they can review/edit it in the "Budget" tab

Do NOT explain calculations or list every category. Keep it 2–3 short sentences max.
`;

      const reply = await callOllama(confirmPrompt, "llama3");
      return res.json({ ok: true, reply });
    }

    // -------------------------
    // B. GENERAL BUDGET / SPENDING QUESTION
    // -------------------------
    if (isBudgetIntent) {
      if (!userId) {
        return res
          .status(400)
          .json({ error: "userId required for budget intent" });
      }

      // IMPORTANT: field is `user`, not `userId`
      const txns = await Transaction.find({ user: userId }).lean();

      const budgetData = computeBudgetFromTransactions(txns, {
        monthlyIncome,
        savingsTargetPct,
      });

      const prompt = `
You are Fin-AI, a concise friendly finance assistant.

User message: "${message}"

Use ONLY the following aggregated data (do not invent numbers):
monthCount: ${budgetData.monthCount}
monthlyAverages: ${JSON.stringify(
        budgetData.monthlyAverages,
        null,
        2
      )}
totals: ${JSON.stringify(budgetData.suggestions.totals, null, 2)}
recommended: ${JSON.stringify(
        budgetData.suggestions.recommended,
        null,
        2
      )}
rules: ${JSON.stringify(budgetData.suggestions.rules, null, 2)}

Task:
1) Provide a one-line summary of the user's spending.
2) Provide a short suggested monthly budget: list up to 6 top categories with amounts.
3) Provide one concrete action to improve savings this month.
4) Show Emergency fund target number.
Keep response short (4–6 lines), friendly, and use only numbers from the data above.
`;

      const reply = await callOllama(prompt, "llama3");
      return res.json({ ok: true, reply });
    }

    // -------------------------
    // C. GENERAL CHAT
    // -------------------------
    const prompt = `
You are Fin-AI, a helpful finance assistant.
User: "${message}"
Reply in 2 short sentences and if user asks about personal data say "I can help with your transactions and budgets — ask 'Create budget'".
`;
    const reply = await callOllama(prompt, "llama3");
    return res.json({ ok: true, reply });
  } catch (err) {
    console.error("ChatController error", err);
    return res.status(500).json({ error: "internal", details: err.message });
  }
}

module.exports = { chatHandler };
