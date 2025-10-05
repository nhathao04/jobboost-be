const express = require("express");
const router = express.Router();
const applicationController = require("../controllers/applicationController");
const { authenticate } = require("../middleware/auth");

// Apply for a job
router.post(
  "/jobs/:jobId/apply",
  authenticate,
  applicationController.applyForJob
);

// Get all applications for the current student
router.get(
  "/student/me",
  authenticate,
  applicationController.getMyApplications
);

// Withdraw application
router.delete(
  "/:applicationId",
  authenticate,
  applicationController.withdrawApplication
);

module.exports = router;
