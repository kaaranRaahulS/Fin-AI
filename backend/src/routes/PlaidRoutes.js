// backend/src/routes/plaidRoutes.js
const express = require("express");
const router = express.Router();
const plaidController = require("../controllers/PlaidController");

// POST /api/plaid/create_link_token
router.post("/create_link_token", plaidController.createLinkToken);

// POST /api/plaid/get_access_token
router.post("/get_access_token", plaidController.exchangePublicToken);

// POST /api/plaid/get_transactions
router.post("/transactions", plaidController.getTransactions);

router.post("/transactions/sync", plaidController.syncTransactions);
module.exports = router;
