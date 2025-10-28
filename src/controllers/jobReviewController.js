const { JobReview, Job, sequelize } = require("../models");
const { Op } = require("sequelize");
const { supabase } = require("../config/supabase");

/**
 * Tạo review cho job
 * POST /api/job-reviews
 */
exports.createJobReview = async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware
    const { job_id, rating, comment } = req.body;

    // Validate input
    if (!job_id || !rating) {
      return res.status(400).json({
        success: false,
        message: "job_id and rating are required",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    // Tìm job
    const job = await Job.findByPk(job_id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Kiểm tra job đã completed chưa
    if (job.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Can only review completed jobs",
      });
    }

    // Tìm application để biết freelancer là ai
    const { Application } = require("../models");
    const application = await Application.findOne({
      where: {
        job_id: job_id,
        status: "completed",
      },
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "No completed application found for this job",
      });
    }

    const employerId = job.owner_id;
    const freelancerId = application.applicant_id;

    // Xác định reviewer role
    let reviewerRole;
    if (userId === employerId) {
      reviewerRole = "EMPLOYER";
    } else if (userId === freelancerId) {
      reviewerRole = "FREELANCER";
    } else {
      return res.status(403).json({
        success: false,
        message: "You are not involved in this job",
      });
    }

    // Kiểm tra đã review chưa
    const existingReview = await JobReview.findOne({
      where: {
        job_id: job_id,
        reviewer_id: userId,
      },
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this job",
      });
    }

    // Tạo review
    const review = await JobReview.create({
      job_id,
      employer_id: employerId,
      freelancer_id: freelancerId,
      reviewer_id: userId,
      reviewer_role: reviewerRole,
      rating,
      comment: comment || null,
    });

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      data: review,
    });
  } catch (error) {
    console.error("Error creating job review:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create review",
      error: error.message,
    });
  }
};

/**
 * Lấy reviews của một job
 * GET /api/job-reviews/job/:jobId
 */
exports.getJobReviews = async (req, res) => {
  try {
    const { jobId } = req.params;

    const reviews = await JobReview.findAll({
      where: { job_id: jobId },
      include: [
        {
          model: Job,
          as: "job",
          attributes: ["id", "title", "status"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    // Fetch user info from Supabase
    const reviewsWithUserInfo = await Promise.all(
      reviews.map(async (review) => {
        const reviewObj = review.toJSON();

        // Get reviewer info
        if (supabase) {
          const { data: reviewer } = await supabase.auth.admin.getUserById(
            review.reviewer_id
          );
          reviewObj.reviewer = {
            id: reviewer?.id,
            email: reviewer?.email,
            name: reviewer?.user_metadata?.full_name || "Unknown",
          };

          // Get employer info
          const { data: employer } = await supabase.auth.admin.getUserById(
            review.employer_id
          );
          reviewObj.employer = {
            id: employer?.id,
            email: employer?.email,
            name: employer?.user_metadata?.full_name || "Unknown",
          };

          // Get freelancer info
          const { data: freelancer } = await supabase.auth.admin.getUserById(
            review.freelancer_id
          );
          reviewObj.freelancer = {
            id: freelancer?.id,
            email: freelancer?.email,
            name: freelancer?.user_metadata?.full_name || "Unknown",
          };
        }

        return reviewObj;
      })
    );

    res.json({
      success: true,
      data: reviewsWithUserInfo,
    });
  } catch (error) {
    console.error("Error getting job reviews:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get reviews",
      error: error.message,
    });
  }
};

/**
 * Lấy reviews của một user (as freelancer or employer)
 * GET /api/job-reviews/user/:userId
 */
exports.getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.query; // 'freelancer' or 'employer'

    let where = {};
    if (role === "freelancer") {
      where.freelancer_id = userId;
    } else if (role === "employer") {
      where.employer_id = userId;
    } else {
      // Get all reviews involving this user
      where[Op.or] = [{ employer_id: userId }, { freelancer_id: userId }];
    }

    const reviews = await JobReview.findAll({
      where,
      include: [
        {
          model: Job,
          as: "job",
          attributes: ["id", "title", "status"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    // Calculate average rating
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    res.json({
      success: true,
      data: {
        reviews,
        statistics: {
          total_reviews: reviews.length,
          average_rating: avgRating.toFixed(1),
        },
      },
    });
  } catch (error) {
    console.error("Error getting user reviews:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user reviews",
      error: error.message,
    });
  }
};

/**
 * Update review
 * PUT /api/job-reviews/:id
 */
exports.updateJobReview = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { rating, comment } = req.body;

    const review = await JobReview.findByPk(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // Chỉ reviewer mới được update
    if (review.reviewer_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own review",
      });
    }

    // Update
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: "Rating must be between 1 and 5",
        });
      }
      review.rating = rating;
    }
    if (comment !== undefined) {
      review.comment = comment;
    }

    await review.save();

    res.json({
      success: true,
      message: "Review updated successfully",
      data: review,
    });
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update review",
      error: error.message,
    });
  }
};

/**
 * Delete review
 * DELETE /api/job-reviews/:id
 */
exports.deleteJobReview = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const review = await JobReview.findByPk(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // Chỉ reviewer mới được delete
    if (review.reviewer_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own review",
      });
    }

    await review.destroy();

    res.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete review",
      error: error.message,
    });
  }
};

/**
 * Admin: Get all job reviews với pagination và filters
 * GET /api/admin/job-reviews
 */
exports.getAllJobReviewsAdmin = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      rating,
      reviewer_role,
      job_id,
      startDate,
      endDate,
      sortBy = "created_at",
      sortOrder = "DESC",
    } = req.query;

    const offset = (page - 1) * limit;
    const limitNum = Math.min(parseInt(limit), 100);

    // Build where clause
    const where = {};
    if (rating) where.rating = parseInt(rating);
    if (reviewer_role) where.reviewer_role = reviewer_role.toUpperCase();
    if (job_id) where.job_id = job_id;
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at[Op.gte] = new Date(startDate);
      if (endDate) where.created_at[Op.lte] = new Date(endDate);
    }

    const { rows: reviews, count: total } = await JobReview.findAndCountAll({
      where,
      include: [
        {
          model: Job,
          as: "job",
          attributes: ["id", "title", "status"],
        },
      ],
      order: [[sortBy, sortOrder]],
      limit: limitNum,
      offset,
    });

    // Fetch user info
    const reviewsWithUserInfo = await Promise.all(
      reviews.map(async (review) => {
        const reviewObj = review.toJSON();

        if (supabase) {
          // Get reviewer
          const { data: reviewer } = await supabase.auth.admin.getUserById(
            review.reviewer_id
          );
          reviewObj.reviewer = {
            id: reviewer?.id,
            email: reviewer?.email,
            name: reviewer?.user_metadata?.full_name || "Unknown",
          };

          // Get employer
          const { data: employer } = await supabase.auth.admin.getUserById(
            review.employer_id
          );
          reviewObj.employer = {
            id: employer?.id,
            email: employer?.email,
            name: employer?.user_metadata?.full_name || "Unknown",
          };

          // Get freelancer
          const { data: freelancer } = await supabase.auth.admin.getUserById(
            review.freelancer_id
          );
          reviewObj.freelancer = {
            id: freelancer?.id,
            email: freelancer?.email,
            name: freelancer?.user_metadata?.full_name || "Unknown",
          };
        }

        return reviewObj;
      })
    );

    // Statistics
    const stats = await JobReview.findOne({
      where,
      attributes: [
        [sequelize.fn("AVG", sequelize.col("rating")), "avg_rating"],
        [sequelize.fn("COUNT", sequelize.col("id")), "total_count"],
      ],
      raw: true,
    });

    res.json({
      success: true,
      data: {
        reviews: reviewsWithUserInfo,
        statistics: {
          average_rating: parseFloat(stats.avg_rating || 0).toFixed(1),
          total_reviews: parseInt(stats.total_count || 0),
        },
        pagination: {
          page: parseInt(page),
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error("Error getting all job reviews:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get reviews",
      error: error.message,
    });
  }
};
