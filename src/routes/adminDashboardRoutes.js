const express = require("express");
const router = express.Router();
const adminDashboardController = require("../controllers/adminDashboardController");
const { authenticate } = require("../middleware/auth");

// TODO: Add requireAdmin middleware to protect these routes
// const { requireAdmin } = require("../middleware/admin");

/**
 * Admin Dashboard Routes
 * All routes require authentication + admin role
 */

// Overview - Tổng quan dashboard
router.get(
  "/admin/dashboard/overview",
  authenticate,
  // requireAdmin, // TODO: Uncomment when admin middleware is ready
  adminDashboardController.getDashboardOverview
);

// Revenue - Chi tiết doanh thu
router.get(
  "/admin/dashboard/revenue",
  authenticate,
  // requireAdmin,
  adminDashboardController.getRevenueDetails
);

// Revenue Chart - Biểu đồ doanh thu
router.get(
  "/admin/dashboard/revenue/chart",
  authenticate,
  // requireAdmin,
  adminDashboardController.getRevenueChart
);

// Users - Chi tiết users
router.get(
  "/admin/dashboard/users",
  authenticate,
  // requireAdmin,
  adminDashboardController.getUsersDetails
);

// Transactions - Chi tiết giao dịch
router.get(
  "/admin/dashboard/transactions",
  authenticate,
  // requireAdmin,
  adminDashboardController.getTransactionsDetails
);

// Reviews - Chi tiết đánh giá
router.get(
  "/admin/dashboard/reviews",
  authenticate,
  // requireAdmin,
  adminDashboardController.getReviewsDetails
);

module.exports = router;
