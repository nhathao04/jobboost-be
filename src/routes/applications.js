const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const { authenticate } = require('../middleware/auth');

// Apply for a job
router.post('/', authenticate, applicationController.applyForJob);

// // Get all applications for a student
// router.get('/student/:studentId', authenticate, applicationController.getApplicationsByStudent);

// // Get all applications for a job
// router.get('/job/:jobId', authenticate, applicationController.getApplicationsByJob);

// // Update application status
// router.patch('/:applicationId/status', authenticate, applicationController.updateApplicationStatus);

// // Withdraw application
// router.delete('/:applicationId', authenticate, applicationController.withdrawApplication);

module.exports = router;