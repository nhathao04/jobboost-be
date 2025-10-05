const express = require("express");
const router = express.Router();
const employerController = require("../controllers/employerController");
const { authenticate } = require("../middleware/auth");

// Get all applications for a job (employer only)
router.get(
  "/jobs/:jobId/applications",
  authenticate,
  employerController.getJobApplications
);

// Get application detail (employer only)
router.get(
  "/applications/:applicationId",
  authenticate,
  employerController.getApplicationDetail
);

// Update application status (employer only)
router.patch(
  "/applications/:applicationId/status",
  authenticate,
  employerController.updateApplicationStatus
);

module.exports = router;
