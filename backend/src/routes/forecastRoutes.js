const express = require("express");
const router = express.Router();
const forecastController = require("../controllers/ForecastController");

// GET /api/forecast?userId=123
router.get("/", forecastController.getForecast);

module.exports = router;
