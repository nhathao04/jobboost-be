const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { authenticate } = require('../middleware/auth');

// Route to create a new assignment
router.post('/', authenticate, assignmentController.createAssignment);

// Route to get all assignments for a student
router.get('/student/:studentId', authenticate, assignmentController.getAssignmentsByStudent);

// Route to get all assignments for an employer
router.get('/employer/:employerId', authenticate, assignmentController.getAssignmentsByEmployer);

// Route to update an assignment
router.put('/:assignmentId', authenticate, assignmentController.updateAssignment);

// Route to delete an assignment
router.delete('/:assignmentId', authenticate, assignmentController.deleteAssignment);

// Route to get assignment details
router.get('/:assignmentId', authenticate, assignmentController.getAssignmentDetails);

module.exports = router;