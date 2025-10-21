const express = require("express");
const router = express.Router();
const jobController = require("../controllers/jobController");
const { authenticate } = require("../middleware/auth");

// Public routes
router.get("/jobs", jobController.getAllJobs); //ok 

// Client (employer) routes
router.post("/jobs", authenticate, jobController.createJob); //ok
router.get("/jobs/my-jobs", authenticate, jobController.getMyJobs);

router.get("/jobs/:jobId", jobController.getJobById);
router.put("/jobs/:jobId", authenticate, jobController.updateJob); //ok update when job's status is pending or rejected
router.delete("/jobs/:jobId", authenticate, jobController.deleteJob);

// Admin routes
router.get("/admin/jobs/pending", jobController.getPendingJobs); //ok
router.put("/admin/jobs/:jobId/review", jobController.reviewJob); // ok active/rejected

module.exports = router;
