const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');

// Route to create a new transaction
router.post('/transactions', authenticate, paymentController.createTransaction);

// Route to get all transactions for a user
router.get('/transactions', authenticate, paymentController.getUserTransactions);

// Route to get a specific transaction by ID
router.get('/transactions/:id', authenticate, paymentController.getTransactionById);

// Route to process a payment
router.post('/process', authenticate, paymentController.processPayment);

// Route to handle refunds
router.post('/refunds', authenticate, paymentController.processRefund);

// Route to get payment statistics
router.get('/statistics', authenticate, paymentController.getPaymentStatistics);

module.exports = router;