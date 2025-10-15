const express = require("express");
const router = express.Router();
const applicationController = require("../controllers/applicationController");
const { authenticate, isFreelancer, isClient } = require("../middleware/auth");

// Freelancer routes
router.post(
  "/applications/:jobId",
  authenticate,
  applicationController.applyForJob
);
router.get(
  "/applications",
  authenticate,
  applicationController.getMyApplications
);
router.put(
  "/applications/:applicationId/withdraw",
  authenticate, 
  applicationController.withdrawApplication
);

// Client (employer) routes
router.get(
  "/jobs/:jobId/applications",
  authenticate,
  applicationController.getApplicationsForJob
);
router.put(
  "/applications/:applicationId/status",
  authenticate,
  applicationController.updateApplicationStatus
);

// Common routes (both freelancer and client)
router.get(
  "/applications/:applicationId",
  authenticate,
  applicationController.getApplicationDetail
);

module.exports = router;
