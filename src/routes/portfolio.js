const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolioController');
const { authenticate } = require('../middleware/auth');

// Route to get all portfolio items for a student
router.get('/:studentId', authenticate, portfolioController.getPortfolioItems);

// Route to add a new portfolio item
router.post('/', authenticate, portfolioController.createPortfolioItem);

// Route to update an existing portfolio item
router.put('/:itemId', authenticate, portfolioController.updatePortfolioItem);

// Route to delete a portfolio item
router.delete('/:itemId', authenticate, portfolioController.deletePortfolioItem);

module.exports = router;