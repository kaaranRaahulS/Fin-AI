// types/categories.ts

export enum SpendingCategory {
	Housing = "Housing/Rent",
	Transportation = "Transportation",
	Groceries = "Groceries",
	Dining = "Dining Out",
	Utilities = "Utilities",
	Entertainment = "Entertainment",
	Shopping = "Shopping",
	Healthcare = "Healthcare",
	Subscriptions = "Subscriptions",
}

export enum SavingsCategory {
	EmergencyFund = "Emergency Fund",
	Investments = "Investments",
	Goals = "Savings Goals",
	OtherSavings = "Other Savings",
}

export type ApiCategoryItem = {
	name: SpendingCategory | SavingsCategory;
	amount: number;
};
