// routes/budgets.js
const express = require("express");
const router = express.Router();
const budgetController = require("../controllers/BudgetController.js");

// If you have auth middleware that sets req.user, replace :userId with authenticated id
// Example endpoints:
//
// GET /api/budgets/:userId        -> get budget
// POST /api/budgets/:userId       -> create/update budget
// DELETE /api/budgets/:userId     -> delete budget

router.get("/:userId", budgetController.getBudget);
router.post("/:userId", budgetController.saveBudget);
router.delete("/:userId", budgetController.deleteBudget);

module.exports = router;
