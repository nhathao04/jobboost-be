const { Transaction } = require('../models');
const { User } = require('../models');
const { Op } = require('sequelize');

class PaymentService {
    async createTransaction(payerId, payeeId, amount, transactionType) {
        try {
            const transaction = await Transaction.create({
                payer_id: payerId,
                payee_id: payeeId,
                transaction_type: transactionType,
                gross_amount: amount,
                platform_fee_rate: 0.03, // 3% default
                platform_fee: amount * 0.03,
                net_amount: amount * 0.97,
                status: 'pending',
            });
            return transaction;
        } catch (error) {
            throw new Error('Transaction creation failed: ' + error.message);
        }
    }

    async getTransactionById(transactionId) {
        try {
            const transaction = await Transaction.findByPk(transactionId);
            if (!transaction) {
                throw new Error('Transaction not found');
            }
            return transaction;
        } catch (error) {
            throw new Error('Error fetching transaction: ' + error.message);
        }
    }

    async getUserTransactions(userId) {
        try {
            const transactions = await Transaction.findAll({
                where: {
                    [Op.or]: [
                        { payer_id: userId },
                        { payee_id: userId }
                    ]
                }
            });
            return transactions;
        } catch (error) {
            throw new Error('Error fetching user transactions: ' + error.message);
        }
    }

    async updateTransactionStatus(transactionId, status) {
        try {
            const transaction = await Transaction.findByPk(transactionId);
            if (!transaction) {
                throw new Error('Transaction not found');
            }
            transaction.status = status;
            await transaction.save();
            return transaction;
        } catch (error) {
            throw new Error('Error updating transaction status: ' + error.message);
        }
    }
}

module.exports = new PaymentService();