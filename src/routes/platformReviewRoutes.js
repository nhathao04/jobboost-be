const express = require("express");
const router = express.Router();
const platformReviewController = require("../controllers/platformReviewController");
const { authenticate } = require("../middleware/auth");

// Public routes - Xem đánh giá
router.get("/platform-reviews", platformReviewController.getReviews);

// Protected routes - Yêu cầu đăng nhập
router.get(
  "/platform-reviews/eligibility",
  authenticate,
  platformReviewController.checkReviewEligibility
);

router.get(
  "/platform-reviews/my-review",
  authenticate,
  platformReviewController.getMyReview
);

router.post(
  "/platform-reviews",
  authenticate,
  platformReviewController.createReview
);

router.put(
  "/platform-reviews/:reviewId",
  authenticate,
  platformReviewController.updateReview
);

router.delete(
  "/platform-reviews/:reviewId",
  authenticate,
  platformReviewController.deleteReview
);

router.post(
  "/platform-reviews/:reviewId/helpful",
  platformReviewController.markHelpful
);

// Admin routes - TODO: Add admin middleware
router.put(
  "/admin/platform-reviews/:reviewId/response",
  authenticate, // TODO: Add requireAdmin middleware
  platformReviewController.adminResponse
);

router.put(
  "/admin/platform-reviews/:reviewId/visibility",
  authenticate, // TODO: Add requireAdmin middleware
  platformReviewController.toggleVisibility
);

module.exports = router;
