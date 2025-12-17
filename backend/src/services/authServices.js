const User = require("../models/User");
const bcrypt = require("bcryptjs");

const registerUser = async ({
	firstName,
	lastName,
	email,
	phone,
	password,
	confirmPassword,
}) => {
	if (password !== confirmPassword) {
		throw new Error("Passwords do not match");
	}

	const existingUser = await User.findOne({ email });
	if (existingUser) {
		throw new Error("Email is already registered");
	}

	const hashedPassword = await bcrypt.hash(password, 10);

	const user = new User({
		firstName,
		lastName,
		email,
		phone,
		password: hashedPassword,
	});

	await user.save();
	return {
		message: "User registered successfully",
		userId: user._id,
	};
};

const loginUser = async ({ email, password }) => {
	const user = await User.findOne({ email });
	if (!user) {
		throw new Error("Invalid email or password");
	}

	const isMatch = await bcrypt.compare(password, user.password);
	if (!isMatch) {
		throw new Error("Invalid email or password");
	}

	return {
		message: "Login successful",
		status: 200,
		user: {
			id: user._id,
			name: `${user.firstName} ${user.lastName}`,
			email: user.email,
		},
	};
};

module.exports = { registerUser, loginUser };
