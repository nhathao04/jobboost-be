const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticate } = require('../middleware/auth');

// Route to create a new review
router.post('/', authenticate, reviewController.createReview);

// Route to get reviews for an assignment
router.get('/assignment/:assignmentId', reviewController.getReviewsByAssignment);

// Route to get reviews by reviewer
router.get('/reviewer/:reviewerId', reviewController.getReviewsByReviewer);

// Route to get reviews by reviewee
router.get('/reviewee/:revieweeId', reviewController.getReviewsByReviewee);

// Route to update a review
router.put('/:reviewId', authenticate, reviewController.updateReview);

// Route to delete a review
router.delete('/:reviewId', authenticate, reviewController.deleteReview);

module.exports = router;