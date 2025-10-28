const express = require("express");
const router = express.Router();
const jobReviewController = require("../controllers/jobReviewController");
const { authenticate } = require("../middleware/auth");

/**
 * @route   POST /api/job-reviews
 * @desc    Tạo review cho job (sau khi completed)
 * @access  Private (Employer hoặc Freelancer involved)
 */
router.post("/job-reviews", authenticate, jobReviewController.createJobReview);

/**
 * @route   GET /api/job-reviews/job/:jobId
 * @desc    Lấy tất cả reviews của một job
 * @access  Public
 */
router.get("/job-reviews/job/:jobId", jobReviewController.getJobReviews);

/**
 * @route   GET /api/job-reviews/user/:userId
 * @desc    Lấy reviews của một user (as freelancer or employer)
 * @access  Public
 * @query   role: 'freelancer' or 'employer' (optional)
 */
router.get("/job-reviews/user/:userId", jobReviewController.getUserReviews);

/**
 * @route   PUT /api/job-reviews/:id
 * @desc    Update review
 * @access  Private (Owner only)
 */
router.put(
  "/job-reviews/:id",
  authenticate,
  jobReviewController.updateJobReview
);

/**
 * @route   DELETE /api/job-reviews/:id
 * @desc    Delete review
 * @access  Private (Owner only)
 */
router.delete(
  "/job-reviews/:id",
  authenticate,
  jobReviewController.deleteJobReview
);

/**
 * @route   GET /api/admin/job-reviews
 * @desc    Admin: Get all job reviews với pagination và filters
 * @access  Admin
 * @query   page, limit, rating, reviewer_role, job_id, startDate, endDate, sortBy, sortOrder
 */
router.get(
  "/admin/job-reviews",
  authenticate,
  // TODO: Add requireAdmin middleware
  jobReviewController.getAllJobReviewsAdmin
);

module.exports = router;
