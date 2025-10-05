const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const adminJobController = require("../controllers/adminJobController");
const { authenticateAdmin } = require("../middleware/auth");

// Admin dashboard routes
router.get(
  "/dashboard/stats",
  authenticateAdmin,
  adminController.getDashboardStats
);

// Admin user management routes
router.get("/users", authenticateAdmin, adminController.getAllUsers);
router.get("/users/:id", authenticateAdmin, adminController.getUserById);
router.put("/users/:id", authenticateAdmin, adminController.updateUser);
router.delete("/users/:id", authenticateAdmin, adminController.deleteUser);

// Admin job management routes
router.get("/jobs", authenticateAdmin, adminController.getAllJobs);
router.delete("/jobs/:id", authenticateAdmin, adminController.deleteJob);

// Admin job approval routes
router.get(
  "/jobs/pending",
  authenticateAdmin,
  adminJobController.getPendingJobs
);
router.patch(
  "/jobs/:jobId/review",
  authenticateAdmin,
  adminJobController.reviewJob
);

module.exports = router;
