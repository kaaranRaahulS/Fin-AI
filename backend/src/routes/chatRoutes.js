// src/routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const { chatHandler } = require('../controllers/ChatController');

router.post('/', chatHandler);

module.exports = router;
