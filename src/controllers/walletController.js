const { Wallet, WalletTransaction, sequelize } = require("../models");
const { Op } = require("sequelize");
const axios = require("axios");
const { env } = require("../config/env");

/**
 * Tạo ví mới cho user
 * POST /api/wallet/create
 */
exports.createWallet = async (req, res) => {
  try {
    const userId = req.userId;
    console.log("Creating wallet for user:", userId);
    const { currency = "VND", initial_balance = 0 } = req.body;

    // Kiểm tra ví đã tồn tại chưa
    const existingWallet = await Wallet.findOne({
      where: { user_id: userId },
    });

    if (existingWallet) {
      return res.status(409).json({
        success: false,
        message: "Wallet already exists for this user",
        data: existingWallet,
      });
    }

    // Validate initial_balance
    const initialBalance = parseFloat(initial_balance);
    if (initialBalance < 0) {
      return res.status(400).json({
        success: false,
        message: "Initial balance must be greater than or equal to 0",
      });
    }

    // Tạo ví mới
    const wallet = await Wallet.create({
      user_id: userId,
      balance: initialBalance,
      currency,
      total_deposited: initialBalance,
      total_spent: 0,
      is_active: true,
    });

    // Nếu có số dư ban đầu, tạo transaction ghi nhận
    if (initialBalance > 0) {
      await WalletTransaction.create({
        wallet_id: wallet.id,
        transaction_type: "DEPOSIT",
        amount: initialBalance,
        currency: wallet.currency,
        balance_before: 0,
        balance_after: initialBalance,
        description: "Initial wallet balance",
        status: "completed",
      });
    }

    res.status(201).json({
      success: true,
      message: "Wallet created successfully",
      data: wallet,
    });
  } catch (error) {
    console.error("Error creating wallet:", error);
    res.status(500).json({
      success: false,
      message: "Error creating wallet",
      error: error.message,
    });
  }
};

/**
 * Lấy thông tin ví của user
 * GET /api/wallet
 */
exports.getWallet = async (req, res) => {
  try {
    const userId = req.userId;
    console.log("Fetching wallet for user:", userId);

    const wallet = await Wallet.findOne({
      where: { user_id: userId },
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
    }

    res.status(200).json({
      success: true,
      data: wallet,
    });
  } catch (error) {
    console.error("Error fetching wallet:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching wallet",
      error: error.message,
    });
  }
};

/**
 * Lấy lịch sử giao dịch
 * GET /api/wallet/transactions
 */
exports.getTransactionHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      page = 1,
      limit = 20,
      transaction_type,
      status,
      start_date,
      end_date,
    } = req.query;

    // Tìm ví
    const wallet = await Wallet.findOne({
      where: { user_id: userId },
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
    }

    // Build where clause
    const where = { wallet_id: wallet.id };

    if (transaction_type) {
      where.transaction_type = transaction_type;
    }

    if (status) {
      where.status = status;
    }

    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) {
        where.created_at[Op.gte] = new Date(start_date);
      }
      if (end_date) {
        where.created_at[Op.lte] = new Date(end_date);
      }
    }

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: transactions } =
      await WalletTransaction.findAndCountAll({
        where,
        order: [["created_at", "DESC"]],
        limit: parseInt(limit),
        offset,
      });

    res.status(200).json({
      success: true,
      data: {
        transactions,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          total_pages: Math.ceil(count / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching transaction history",
      error: error.message,
    });
  }
};

/**
 * Hàm helper: Trừ tiền khi đăng bài (được gọi từ jobController)
 * Không phải endpoint API trực tiếp
 */
exports.deductMoneyForJobPost = async (
  userId,
  jobPostCost,
  jobId,
  transaction
) => {
  try {
    // Tìm ví
    const wallet = await Wallet.findOne({
      where: { user_id: userId },
      transaction,
    });

    if (!wallet) {
      throw new Error("Wallet not found. Please create a wallet first.");
    }

    if (!wallet.is_active) {
      throw new Error("Wallet is not active");
    }

    const balanceBefore = parseFloat(wallet.balance);
    const postCost = parseFloat(jobPostCost);

    // Kiểm tra số dư
    if (balanceBefore < postCost) {
      throw new Error(
        `Insufficient balance. Current: ${balanceBefore}, Required: ${postCost}`
      );
    }

    const balanceAfter = balanceBefore - postCost;

    // Cập nhật số dư ví
    await wallet.update(
      {
        balance: balanceAfter,
        total_spent: parseFloat(wallet.total_spent) + postCost,
      },
      { transaction }
    );

    // Tạo giao dịch
    const walletTransaction = await WalletTransaction.create(
      {
        wallet_id: wallet.id,
        transaction_type: "JOB_POST",
        amount: postCost,
        currency: wallet.currency,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        reference_id: jobId,
        reference_type: "JOB",
        description: `Payment for job posting`,
        status: "completed",
      },
      { transaction }
    );

    return {
      wallet,
      transaction: walletTransaction,
      balance_after: balanceAfter,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Hoàn tiền khi job bị từ chối hoặc xóa
 */
exports.refundMoneyForJob = async (
  userId,
  refundAmount,
  jobId,
  reason,
  transaction
) => {
  try {
    const wallet = await Wallet.findOne({
      where: { user_id: userId },
      transaction,
    });

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    const balanceBefore = parseFloat(wallet.balance);
    const refund = parseFloat(refundAmount);
    const balanceAfter = balanceBefore + refund;

    // Cập nhật số dư ví
    await wallet.update(
      {
        balance: balanceAfter,
        total_spent: parseFloat(wallet.total_spent) - refund,
      },
      { transaction }
    );

    // Tạo giao dịch hoàn tiền
    const walletTransaction = await WalletTransaction.create(
      {
        wallet_id: wallet.id,
        transaction_type: "REFUND",
        amount: refund,
        currency: wallet.currency,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        reference_id: jobId,
        reference_type: "JOB",
        description: reason || "Refund for job posting",
        status: "completed",
      },
      { transaction }
    );

    return {
      wallet,
      transaction: walletTransaction,
      balance_after: balanceAfter,
    };
  } catch (error) {
    throw error;
  }
};

exports.rechargeWallet = async (req, res) => {
  try {
    const userId = req.userId;
    const { code } = req.body;

    // Validate code
    if (!code || typeof code !== "string" || code.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Invalid wallet code",
      });
    }

    const response = await axios.get(env.PAYMENT.GATEWAY_URL + `/${code}`);

    if (
      !response.data ||
      !response.data.status ||
      response.data.status !== "ok"
    ) {
      return res.status(400).json({
        success: false,
        message: "Failed to recharge wallet",
      });
    }
    const { money } = response.data;
    // Lọc money từ string sang number, loại bỏ ký tự không phải số
    const amount = parseFloat(money.toString().replace(/[^0-9.-]+/g, ""));
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid wallet money amount",
      });
    }

    const wallet = await Wallet.findOne({
      where: { user_id: userId },
    });

    if (!wallet) {
      const wallet = await Wallet.create({
        user_id: userId,
        balance: initialBalance,
        currency,
        total_deposited: initialBalance,
        total_spent: 0,
        wallet_code: genWalletCode(),
        is_active: true,
      });
    } else if (!wallet.wallet_code || wallet.wallet_code.trim() === "") {
      await wallet.update({ wallet_code: genWalletCode() });
    }

    if (wallet.wallet_code == code) {
      const balanceBefore = parseFloat(wallet.balance);
      const balanceAfter = balanceBefore + amount;

      // Cập nhật số dư ví
      await wallet.update({
        balance: balanceAfter,
        total_deposited: parseFloat(wallet.total_deposited) + amount,
        wallet_code: genWalletCode(),
      });

      // ✅ LƯU TRANSACTION KHI NẠP TIỀN
      await WalletTransaction.create({
        wallet_id: wallet.id,
        transaction_type: "DEPOSIT",
        amount: amount,
        currency: wallet.currency,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        reference_id: code,
        reference_type: "RECHARGE",
        description: `Recharged wallet with code: ${code}`,
        status: "completed",
        metadata: {
          code: code,
          payment_gateway: env.PAYMENT.GATEWAY_URL,
        },
      });

      console.log(`✅ Wallet recharged: ${userId} - Amount: ${amount} VND`);

      return res.status(200).json({
        success: true,
        message: "Wallet recharged successfully",
        data: {
          wallet: {
            id: wallet.id,
            balance: balanceAfter,
            currency: wallet.currency,
            total_deposited: parseFloat(wallet.total_deposited) + amount,
          },
          transaction: {
            amount: amount,
            balance_before: balanceBefore,
            balance_after: balanceAfter,
            type: "DEPOSIT",
          },
        },
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Wallet code does not match",
      });
    }
  } catch (error) {
    console.error("Error recharging wallet:", error);
    res.status(500).json({
      success: false,
      message: "Error recharging wallet",
      error: error.message,
    });
  }
};

exports.getWalletCode = async (req, res) => {
  try {
    const userId = req.userId;
    const wallet = await Wallet.findOne({
      where: { user_id: userId },
    });
    if (!wallet) {
      const wallet = await Wallet.create({
        user_id: userId,
        balance: initialBalance,
        currency,
        total_deposited: initialBalance,
        total_spent: 0,
        wallet_code: genWalletCode(),
        is_active: true,
      });
    } else if (!wallet.wallet_code || wallet.wallet_code.trim() === "") {
      await wallet.update({ wallet_code: genWalletCode() });
    }
    res.status(200).json({
      success: true,
      data: { wallet_code: wallet.wallet_code },
    });
  } catch (error) {
    console.error("Error fetching wallet code:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching wallet code",
      error: error.message,
    });
  }
};

const genWalletCode = () =>
  Array.from(
    { length: 6 },
    () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 36)]
  ).join("");
