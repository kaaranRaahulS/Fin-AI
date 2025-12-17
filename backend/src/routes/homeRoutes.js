// backend/src/routes/homeRoutes.js
const express = require('express');
const router = express.Router();
const homeController = require('../controllers/HomeController');

// Get home screen data
router.get('/', homeController.getHomeData);
router.get('/all-transactions', homeController.getAllTransactionsForUser);

module.exports = router;
