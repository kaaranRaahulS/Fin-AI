const PlaidItem = require("../models/PlaidItem");
const Account = require("../models/Account");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const PlaidAccountToken = require("../models/PlaidAccountToken");

const deleteData = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: "Missing userId" });
        await PlaidItem.deleteMany({ user: userId });
        await Account.deleteMany({ user: userId });
        await Transaction.deleteMany({ user: userId });
        await PlaidAccountToken.deleteMany({ user: userId });
        console.log("Data deleted successfully");
        console.log("User ID: ", userId);
        res.status(200).json({ message: "Data deleted successfully" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const deleteAccount = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: "Missing userId" });
        await PlaidItem.deleteMany({ user: userId });
        await Account.deleteMany({ user: userId });
        await Transaction.deleteMany({ user: userId });
        await PlaidAccountToken.deleteMany({ user: userId });
        await User.deleteOne({ _id: userId });
        res.status(200).json({ message: "Account deleted successfully" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = { deleteData, deleteAccount };
