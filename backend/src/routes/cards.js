const express = require('express');
const router = express.Router();
const cardsController = require('../controllers/CardsController');

// Get cards data
router.get('/', cardsController.getCardsData);
router.post("/delete", cardsController.deleteCard);


module.exports = router;
