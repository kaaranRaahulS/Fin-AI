// backend/src/plaidClient.js
const { Configuration, PlaidApi, PlaidEnvironments } = require("plaid");
require("dotenv").config();

const configuration = new Configuration({
	basePath: PlaidEnvironments.sandbox,
	baseOptions: {
		headers: {
			"PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
			"PLAID-SECRET": process.env.PLAID_SECRET,
			"Plaid-Version": "2020-09-14",
		},
	},
});

const plaidClient = new PlaidApi(configuration);

module.exports = plaidClient;