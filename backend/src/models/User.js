const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
	{
		firstName: {
			type: String,
			required: [true, "First name is required"],
		},
		lastName: {
			type: String,
			required: [true, "Last name is required"],
		},
		email: {
			type: String,
			required: [true, "Email is required"],
			unique: true,
			match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
		},
		phone: {
			type: String,
			required: [true, "Phone number is required"],
			match: [/^\+?1?\d{10}$/, "Invalid US phone number"],
		},
		password: {
			type: String,
			required: [true, "Password is required"],
			minlength: [6, "Password must be at least 6 characters long"],
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
