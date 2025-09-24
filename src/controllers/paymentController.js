const { Transaction } = require("../models");
const { handleError } = require("../utils/helpers");
const { Op } = require("sequelize");

// Create a new transaction
exports.createTransaction = async (req, res) => {
  try {
    const {
      assignment_id,
      payer_id,
      payee_id,
      amount,
      transaction_type,
      description,
    } = req.body;

    const transaction = await Transaction.create({
      assignment_id,
      payer_id,
      payee_id,
      amount,
      transaction_type: transaction_type || "payment",
      status: "pending",
      description,
    });

    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    handleError(res, error);
  }
};

// Get user transactions
exports.getUserTransactions = async (req, res) => {
  try {
    const userId = req.userId; // from auth middleware

    const transactions = await Transaction.findAll({
      where: {
        [Op.or]: [{ payer_id: userId }, { payee_id: userId }],
      },
      order: [["created_at", "DESC"]],
    });

    res.status(200).json({ success: true, data: transactions });
  } catch (error) {
    handleError(res, error);
  }
};

// Get transaction by ID
exports.getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findByPk(id);

    if (!transaction) {
      return res
        .status(404)
        .json({ success: false, message: "Transaction not found" });
    }

    res.status(200).json({ success: true, data: transaction });
  } catch (error) {
    handleError(res, error);
  }
};

// Process payment
exports.processPayment = async (req, res) => {
  try {
    const { assignmentId, payerId, payeeId, amount } = req.body;

    // Validate input
    if (!assignmentId || !payerId || !payeeId || !amount) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required." });
    }

    // Create payment transaction
    const transaction = await Transaction.create({
      assignment_id: assignmentId,
      payer_id: payerId,
      payee_id: payeeId,
      amount,
      transaction_type: "payment",
      status: "completed",
    });

    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    handleError(res, error);
  }
};

// Process refund
exports.processRefund = async (req, res) => {
  try {
    const { transactionId, amount, reason } = req.body;

    // Find original transaction
    const originalTransaction = await Transaction.findByPk(transactionId);

    if (!originalTransaction) {
      return res
        .status(404)
        .json({ success: false, message: "Original transaction not found" });
    }

    // Create refund transaction
    const refundTransaction = await Transaction.create({
      assignment_id: originalTransaction.assignment_id,
      payer_id: originalTransaction.payee_id, // Reverse payer/payee
      payee_id: originalTransaction.payer_id,
      amount: amount || originalTransaction.amount,
      transaction_type: "refund",
      status: "completed",
      description: reason || "Refund processed",
    });

    res.status(200).json({ success: true, data: refundTransaction });
  } catch (error) {
    handleError(res, error);
  }
};

// Get payment statistics
exports.getPaymentStatistics = async (req, res) => {
  try {
    const totalTransactions = await Transaction.count();
    const totalAmount = await Transaction.sum("amount", {
      where: { status: "completed" },
    });

    // Get transactions by status
    const completedTransactions = await Transaction.count({
      where: { status: "completed" },
    });

    const pendingTransactions = await Transaction.count({
      where: { status: "pending" },
    });

    const cancelledTransactions = await Transaction.count({
      where: { status: "cancelled" },
    });

    // Get recent transactions
    const recentTransactions = await Transaction.findAll({
      limit: 5,
      order: [["created_at", "DESC"]],
      include: [
        { model: User, as: "Payer", attributes: ["id", "full_name"] },
        { model: User, as: "Payee", attributes: ["id", "full_name"] },
      ],
    });

    const statistics = {
      total_transactions: totalTransactions,
      total_amount: totalAmount || 0,
      by_status: {
        completed: completedTransactions,
        pending: pendingTransactions,
        cancelled: cancelledTransactions,
      },
      recent_transactions: recentTransactions,
    };

    res.status(200).json({ success: true, data: statistics });
  } catch (error) {
    handleError(res, error);
  }
};

// Get payment statistics
exports.getPaymentStatistics = async (req, res) => {
  try {
    const totalTransactions = await Transaction.count();
    const totalAmount = await Transaction.sum("amount", {
      where: { transaction_type: "payment", status: "completed" },
    });

    const completedPayments = await Transaction.count({
      where: { transaction_type: "payment", status: "completed" },
    });

    const pendingPayments = await Transaction.count({
      where: { transaction_type: "payment", status: "pending" },
    });

    const refunds = await Transaction.count({
      where: { transaction_type: "refund" },
    });

    res.status(200).json({
      success: true,
      data: {
        totalTransactions,
        totalAmount: totalAmount || 0,
        completedPayments,
        pendingPayments,
        refunds,
      },
    });
  } catch (error) {
    handleError(res, error);
  }
};
