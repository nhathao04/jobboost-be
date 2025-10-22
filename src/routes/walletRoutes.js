const express = require("express");
const router = express.Router();
const walletController = require("../controllers/walletController");
const { authenticate } = require("../middleware/auth");


router.get("/wallet/code", authenticate, walletController.getWalletCode);
router.post("/wallet/recharge", authenticate, walletController.rechargeWallet);

/**
 * @swagger
 * tags:
 *   name: Wallet
 *   description: API quản lý ví tiền
 */

/**
 * @swagger
 * /api/wallet/create:
 *   post:
 *     summary: Tạo ví mới cho user
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currency:
 *                 type: string
 *                 enum: [VND, USD, EUR, JPY]
 *                 default: VND
 *                 description: Loại tiền tệ
 *               initial_balance:
 *                 type: number
 *                 default: 0
 *                 description: Số dư ban đầu (mặc định là 0)
 *     responses:
 *       201:
 *         description: Ví được tạo thành công
 *       409:
 *         description: Ví đã tồn tại
 *       400:
 *         description: Số dư ban đầu không hợp lệ
 */
router.post("/wallet/create", authenticate, walletController.createWallet);

/**
 * @swagger
 * /api/wallet:
 *   get:
 *     summary: Lấy thông tin ví của user
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin ví
 *       404:
 *         description: Không tìm thấy ví
 */
router.get("/wallet", walletController.getWallet);

/**
 * @swagger
 * /api/wallet/transactions:
 *   get:
 *     summary: Lấy lịch sử giao dịch
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: transaction_type
 *         schema:
 *           type: string
 *           enum: [DEPOSIT, WITHDRAW, JOB_POST, REFUND, BONUS]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed, cancelled]
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Danh sách giao dịch
 *       404:
 *         description: Không tìm thấy ví
 */
router.get(
  "/wallet/transactions",
  authenticate,
  walletController.getTransactionHistory
);

module.exports = router;
