const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { authenticateAdmin } = require("../middleware/auth");

// Admin routes
router.get(
  "/dashboard/stats",
  authenticateAdmin,
  adminController.getDashboardStats
);
router.get("/users", authenticateAdmin, adminController.getAllUsers);
router.get("/users/:id", authenticateAdmin, adminController.getUserById);
router.put("/users/:id", authenticateAdmin, adminController.updateUser);
router.delete("/users/:id", authenticateAdmin, adminController.deleteUser);
router.get("/jobs", authenticateAdmin, adminController.getAllJobs);
router.delete("/jobs/:id", authenticateAdmin, adminController.deleteJob);

module.exports = router;
