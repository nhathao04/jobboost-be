const { Review, Assignment, User } = require("../models");
const { handleError } = require("../utils/helpers");

// Create a new review
exports.createReview = async (req, res) => {
  try {
    const { assignment_id, reviewer_id, rating, title, comment } = req.body;

    // Check if the assignment exists
    const assignment = await Assignment.findByPk(assignment_id);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const review = await Review.create({
      assignment_id,
      reviewer_id,
      rating,
      title,
      comment,
    });

    res
      .status(201)
      .json({
        success: true,
        message: "Review created successfully",
        data: review,
      });
  } catch (error) {
    handleError(res, error);
  }
};

// Get reviews for an assignment
exports.getReviewsByAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const reviews = await Review.findAll({
      where: { assignment_id: assignmentId },
      include: [
        {
          model: User,
          as: "Reviewer",
          attributes: ["id", "full_name", "avatar_url"],
        },
      ],
    });

    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    handleError(res, error);
  }
};

// Get reviews by reviewer
exports.getReviewsByReviewer = async (req, res) => {
  try {
    const { reviewerId } = req.params;

    const reviews = await Review.findAll({
      where: { reviewer_id: reviewerId },
      include: [{ model: Assignment }],
    });

    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    handleError(res, error);
  }
};

// Get reviews by reviewee
exports.getReviewsByReviewee = async (req, res) => {
  try {
    const { revieweeId } = req.params;

    const reviews = await Review.findAll({
      include: [
        {
          model: Assignment,
          where: { student_id: revieweeId },
        },
      ],
    });

    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    handleError(res, error);
  }
};

// Update a review
exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, title, comment } = req.body;

    const review = await Review.findByPk(reviewId);
    if (!review) {
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    }

    const updatedReview = await review.update({ rating, title, comment });

    res
      .status(200)
      .json({
        success: true,
        message: "Review updated successfully",
        data: updatedReview,
      });
  } catch (error) {
    handleError(res, error);
  }
};

// Delete a review
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findByPk(reviewId);
    if (!review) {
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    }

    await review.destroy();

    res
      .status(200)
      .json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    handleError(res, error);
  }
};
