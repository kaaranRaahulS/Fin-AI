// src/utils/budgetUtils.js
const dayjs = require('dayjs');

/**
 * transactions: array of Transaction docs
 * userProfile: { monthlyIncome?: number, savingsTargetPct?: number }
 */
function computeBudgetFromTransactions(transactions = [], userProfile = {}) {
  const now = dayjs();
  const sixMonthStart = now.subtract(6, 'month');
  const recent = transactions.filter(t => dayjs(t.date).isAfter(sixMonthStart));

  const months = {};
  const categoryMonthly = {};

  recent.forEach(t => {
    const amt = Number(t.amount);
    if (!isFinite(amt)) return;

    // ✅ Only treat positive as spending (money OUT)
    if (amt <= 0) return;

    const monthKey = dayjs(t.date).format('YYYY-MM');
    months[monthKey] = true;

    // ✅ Normalize category: handle array / string / Plaid primary
    let catSource = t.category;
    let cat = 'uncategorized';

    if (Array.isArray(catSource) && catSource.length > 0) {
      // use the most specific (last) category from Plaid array
      cat = String(catSource[catSource.length - 1]);
    } else if (typeof catSource === 'string') {
      cat = catSource;
    } else if (t.raw?.personal_finance_category?.primary) {
      cat = t.raw.personal_finance_category.primary;
    }

    cat = cat.toLowerCase();

    if (!categoryMonthly[cat]) categoryMonthly[cat] = {};
    categoryMonthly[cat][monthKey] =
      (categoryMonthly[cat][monthKey] || 0) + amt; // amt is already positive expense
  });

  const monthCount = Math.max(Object.keys(months).length, 1);

  const monthlyAverages = {};
  Object.keys(categoryMonthly).forEach(cat => {
    const totals = Object.values(categoryMonthly[cat]);
    const sum = totals.reduce((s, v) => s + v, 0);
    monthlyAverages[cat] = +(sum / monthCount).toFixed(2);
  });

  // ✅ class fixed vs discretionary by keywords
  const fixedKeywords = [
    'rent',
    'mortgage',
    'utilities',
    'electricity',
    'water',
    'insurance',
    'loan',
    'subscription',
  ];
  const fixed = {};
  const discretionary = {};

  Object.entries(monthlyAverages).forEach(([cat, avg]) => {
    const isFixed = fixedKeywords.some(k => cat.includes(k));
    if (isFixed) fixed[cat] = avg;
    else discretionary[cat] = avg;
  });

  const monthlyIncome = userProfile.monthlyIncome || null;
  const savingsTargetPct =
    userProfile.savingsTargetPct != null ? userProfile.savingsTargetPct : 0.2;

  const totalFixed = Object.values(fixed).reduce((s, v) => s + v, 0);
  const totalDiscretionary = Object.values(discretionary).reduce((s, v) => s + v, 0);

  const suggestions = {
    fixed,
    discretionary,
    totals: {
      totalFixed: +totalFixed.toFixed(2),
      totalDiscretionary: +totalDiscretionary.toFixed(2),
      totalSpending: +(totalFixed + totalDiscretionary).toFixed(2),
    },
    recommended: {},
  };

  if (monthlyIncome) {
    const savingsTarget = +(monthlyIncome * savingsTargetPct).toFixed(2);
    const discretionaryCap = Math.max(monthlyIncome - totalFixed - savingsTarget, 0);
    suggestions.recommended = {
      monthlyIncome,
      savingsTarget,
      discretionaryCap,
      recommendedDiscretionaryReduction: Math.max(
        0,
        totalDiscretionary - discretionaryCap
      ),
    };
  } else {
    suggestions.recommended = {
      strategy: 'no-income-known',
      suggestedDiscretionaryCutPct: 0.15,
    };
  }

  suggestions.rules = {
    emergencyFundTarget: +(totalFixed * 3).toFixed(2),
    savingsGoalPct: savingsTargetPct,
  };

  return { monthlyAverages, suggestions, monthCount };
}

module.exports = { computeBudgetFromTransactions };
