const express = require("express");
const router = express.Router();
const applicationController = require("../controllers/applicationController");
const { authenticate, isFreelancer, isClient } = require("../middleware/auth");

// Freelancer routes
router.post(
  "/jobs/:jobId/apply",
  applicationController.applyForJob
);
router.get(
  "/applications/my-applications",
  applicationController.getMyApplications
);
router.put(
  "/applications/:applicationId/withdraw",
  applicationController.withdrawApplication
);

// Client (employer) routes
router.get(
  "/jobs/:jobId/applications",
  applicationController.getApplicationsForJob
);
router.put(
  "/applications/:applicationId/status",
  applicationController.updateApplicationStatus
);

// Common routes (both freelancer and client)
router.get(
  "/applications/:applicationId",
  applicationController.getApplicationDetail
);

module.exports = router;
