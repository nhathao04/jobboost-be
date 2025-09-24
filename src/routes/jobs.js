const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { authenticate } = require('../middleware/auth');

// Route to create a new job
router.post('/', authenticate, jobController.createJob);

// Route to get all jobs
router.get('/', jobController.getAllJobs);

// Route to get a job by ID
router.get('/:id', jobController.getJobById);

// Route to update a job by ID
router.put('/:id', authenticate, jobController.updateJob);

// Route to delete a job by ID
router.delete('/:id', authenticate, jobController.deleteJob);

// // Route to get jobs by category
// router.get('/category/:categoryId', jobController.getJobsByCategory);

// // Route to search jobs
// router.get('/search', jobController.searchJobs);

module.exports = router;