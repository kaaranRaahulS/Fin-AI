const authService = require("../services/authServices");

const register = async (req, res) => {
	try {
		const response = await authService.registerUser(req.body);
		res.status(200).json(response);
	} catch (error) {
		res.status(400).json({ error: error.message });
	}
};

const login = async (req, res) => {
	try {
		const response = await authService.loginUser(req.body);
		res.status(200).json(response);
	} catch (error) {
		res.status(400).json({ error: error.message });
	}
};

module.exports = { register, login };
