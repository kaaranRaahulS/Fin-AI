const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const plaidRoutes = require("./src/routes/plaidRoutes");
const homeRoutes = require("./src/routes/homeRoutes");
const cardsRoutes = require("./src/routes/cards");

//Enable CORS for all requests (no need for app.options in Express 5)
const app = express();
app.use(cors());

require("dotenv").config();

const authRoutes = require("./src/routes/authRoutes");
const budgetRoutes = require("./src/routes/budgetRoutes");
const chatRoutes = require('./src/routes/chatRoutes');
const forecastRoutes = require("./src/routes/forecastRoutes");
const settingsRoutes = require("./src/routes/SettingsRoutes");

//Parse JSON
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

//Test route
app.get("/", (req, res) => {
	res.status(200).send("Backend is running");
});

//API routes
app.use("/api/auth", authRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/plaid", plaidRoutes);
app.use("/api/home", homeRoutes);
app.use("/api/cards", cardsRoutes);
app.use('/api/chat', chatRoutes);
app.use("/api/forecast", forecastRoutes);
app.use("/api/settings", settingsRoutes);
const PORT = process.env.PORT || 8000;

//Connect to MongoDB
mongoose
	.connect(process.env.MONGO_URI)
	.then(() => {
		app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
	})
	.catch((err) => console.error("MongoDB connection error:", err));

// module.exports(configuration);