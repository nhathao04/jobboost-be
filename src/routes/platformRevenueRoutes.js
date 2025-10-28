const express = require("express");
const router = express.Router();
const platformRevenueController = require("../controllers/platformRevenueController");
const { authenticate } = require("../middleware/auth");

// TODO: Thêm middleware requireAdmin để bảo vệ routes

/**
 * @route   GET /admin/platform-revenue/overview
 * @desc    Lấy tổng quan platform revenue
 * @access  Admin
 * @query   period: today, week, month, year, all
 */
router.get(
  "/admin/platform-revenue/overview",
  authenticate,
  // requireAdmin,
  platformRevenueController.getPlatformRevenueOverview
);

/**
 * @route   GET /admin/platform-revenue/details
 * @desc    Lấy chi tiết platform revenue với phân trang
 * @access  Admin
 * @query   page, limit, startDate, endDate, revenueType, minAmount, maxAmount, sortBy, sortOrder
 */
router.get(
  "/admin/platform-revenue/details",
  authenticate,
  // requireAdmin,
  platformRevenueController.getPlatformRevenueDetails
);

/**
 * @route   GET /admin/platform-revenue/chart
 * @desc    Lấy dữ liệu biểu đồ platform revenue
 * @access  Admin
 * @query   period: day, week, month, year
 */
router.get(
  "/admin/platform-revenue/chart",
  authenticate,
  // requireAdmin,
  platformRevenueController.getPlatformRevenueChart
);

/**
 * @route   GET /admin/platform-revenue/breakdown
 * @desc    Lấy revenue breakdown theo freelancer hoặc employer
 * @access  Admin
 * @query   type (freelancer/employer), page, limit, period
 */
router.get(
  "/admin/platform-revenue/breakdown",
  authenticate,
  // requireAdmin,
  platformRevenueController.getPlatformRevenueBreakdown
);

module.exports = router;
