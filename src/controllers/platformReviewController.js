const {
  PlatformReview,
  Application,
  Job,
  Wallet,
  sequelize,
} = require("../models");
const { Op } = require("sequelize");

/**
 * Kiểm tra xem user có đủ điều kiện để được đề xuất đánh giá không
 * Logic: Đề xuất sau mỗi 3 job hoàn thành HOẶC sau khi sử dụng 30 ngày HOẶC đạt milestone tiền
 */
exports.checkReviewEligibility = async (req, res) => {
  try {
    const userId = req.userId;
    const { user_role } = req.query; // FREELANCER hoặc EMPLOYER

    if (!user_role || !["FREELANCER", "EMPLOYER"].includes(user_role)) {
      return res.status(400).json({
        success: false,
        message: "user_role is required (FREELANCER or EMPLOYER)",
      });
    }

    // Kiểm tra đã đánh giá chưa
    const existingReview = await PlatformReview.findOne({
      where: {
        user_id: userId,
        user_role,
        status: "active",
      },
      order: [["created_at", "DESC"]],
    });

    const now = new Date();
    let shouldPrompt = false;
    let reason = "";
    let stats = {};

    if (user_role === "FREELANCER") {
      // Đếm số job đã hoàn thành
      const completedJobs = await Application.count({
        where: {
          applicant_id: userId,
          status: "completed",
        },
      });

      // Tính tổng tiền đã kiếm
      const applications = await Application.findAll({
        where: {
          applicant_id: userId,
          status: "completed",
        },
        attributes: ["proposed_rate"],
      });

      const totalEarned = applications.reduce(
        (sum, app) => sum + parseFloat(app.proposed_rate || 0),
        0
      );

      stats = {
        completed_jobs: completedJobs,
        total_earned: totalEarned,
      };

      // Kiểm tra các điều kiện đề xuất - ĐIỀU CHỈNH CHO DỰ ÁN NGẮN HẠN
      if (!existingReview) {
        // Chưa đánh giá lần nào - Giảm từ 3 xuống 1 job
        if (completedJobs >= 1) {
          shouldPrompt = true;
          reason =
            "Bạn đã hoàn thành công việc đầu tiên! Hãy chia sẻ trải nghiệm của bạn.";
        }
      } else {
        // Đã đánh giá rồi, kiểm tra xem có nên đề xuất lại không
        const daysSinceLastReview = Math.floor(
          (now - new Date(existingReview.created_at)) / (1000 * 60 * 60 * 24)
        );

        const jobsSinceLastReview =
          completedJobs - existingReview.completed_jobs_count;

        // Giảm từ 90 ngày xuống 7 ngày, từ 5 jobs xuống 2 jobs
        if (daysSinceLastReview >= 7 && jobsSinceLastReview >= 2) {
          shouldPrompt = true;
          reason =
            "Đã 1 tuần kể từ lần đánh giá cuối. Trải nghiệm của bạn có thay đổi không?";
        } else if (jobsSinceLastReview >= 3) {
          // Giảm từ 10 jobs xuống 3 jobs
          shouldPrompt = true;
          reason = `Bạn đã hoàn thành thêm ${jobsSinceLastReview} công việc! Cập nhật đánh giá nhé.`;
        }
      }
    } else {
      // EMPLOYER
      // Đếm số job đã tạo và hoàn thành
      const createdJobs = await Job.count({
        where: {
          owner_id: userId,
          status: {
            [Op.in]: ["active", "completed"],
          },
        },
      });

      const completedJobs = await Application.count({
        include: [
          {
            model: Job,
            as: "job",
            where: { owner_id: userId },
          },
        ],
        where: {
          status: "completed",
        },
      });

      // Tính tổng tiền đã chi
      const wallet = await Wallet.findOne({
        where: { user_id: userId },
      });

      stats = {
        created_jobs: createdJobs,
        completed_jobs: completedJobs,
        total_spent: wallet ? parseFloat(wallet.total_spent) : 0,
      };

      // Kiểm tra các điều kiện đề xuất - ĐIỀU CHỈNH CHO DỰ ÁN NGẮN HẠN
      if (!existingReview) {
        // Giảm từ (2 completed hoặc 3 created) xuống (1 completed hoặc 1 created)
        if (completedJobs >= 1 || createdJobs >= 1) {
          shouldPrompt = true;
          reason =
            "Bạn đã đăng tin tuyển dụng! Chia sẻ trải nghiệm tuyển dụng của bạn.";
        }
      } else {
        const daysSinceLastReview = Math.floor(
          (now - new Date(existingReview.created_at)) / (1000 * 60 * 60 * 24)
        );

        const jobsSinceLastReview =
          completedJobs - existingReview.completed_jobs_count;

        // Giảm từ 90 ngày xuống 7 ngày, từ 3 jobs xuống 2 jobs
        if (daysSinceLastReview >= 7 && jobsSinceLastReview >= 2) {
          shouldPrompt = true;
          reason = "Đã lâu rồi! Cập nhật đánh giá về chất lượng ứng viên nhé.";
        } else if (jobsSinceLastReview >= 2) {
          // Giảm ngưỡng để dễ trigger
          shouldPrompt = true;
          reason = `Bạn đã tuyển dụng thêm ${jobsSinceLastReview} lần! Đánh giá lại trải nghiệm nhé.`;
        }
      }
    }

    res.status(200).json({
      success: true,
      data: {
        should_prompt: shouldPrompt,
        reason,
        has_reviewed: !!existingReview,
        last_review: existingReview
          ? {
              rating: existingReview.rating,
              created_at: existingReview.created_at,
            }
          : null,
        stats,
      },
    });
  } catch (error) {
    console.error("Error checking review eligibility:", error);
    res.status(500).json({
      success: false,
      message: "Error checking review eligibility",
      error: error.message,
    });
  }
};

/**
 * Tạo đánh giá mới
 * POST /api/platform-reviews
 */
exports.createReview = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      user_role,
      rating,
      comment,
      aspects, // { user_interface: 5, job_quality: 4, support: 5, payment: 4 }
    } = req.body;

    // Validation
    if (!user_role || !["FREELANCER", "EMPLOYER"].includes(user_role)) {
      return res.status(400).json({
        success: false,
        message: "user_role is required (FREELANCER or EMPLOYER)",
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "rating must be between 1 and 5",
      });
    }

    // Kiểm tra đã đánh giá trong 30 ngày gần đây chưa (tránh spam)
    // ĐIỀU CHỈNH: Giảm từ 30 ngày xuống 3 ngày cho dự án ngắn hạn
    const recentReview = await PlatformReview.findOne({
      where: {
        user_id: userId,
        user_role,
        created_at: {
          [Op.gte]: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 ngày
        },
      },
    });

    if (recentReview) {
      return res.status(400).json({
        success: false,
        message: "Bạn đã đánh giá trong 3 ngày gần đây. Vui lòng thử lại sau.",
        existing_review: recentReview,
      });
    }

    // Lấy thống kê để lưu vào review
    let completedJobsCount = 0;
    let totalAmount = 0;
    let isVerified = false;

    if (user_role === "FREELANCER") {
      completedJobsCount = await Application.count({
        where: {
          applicant_id: userId,
          status: "completed",
        },
      });

      const applications = await Application.findAll({
        where: {
          applicant_id: userId,
          status: "completed",
        },
        attributes: ["proposed_rate"],
      });

      totalAmount = applications.reduce(
        (sum, app) => sum + parseFloat(app.proposed_rate || 0),
        0
      );

      // Verified nếu đã hoàn thành >= 1 job (giảm từ 3 jobs)
      isVerified = completedJobsCount >= 1;
    } else {
      // EMPLOYER
      completedJobsCount = await Application.count({
        include: [
          {
            model: Job,
            as: "job",
            where: { owner_id: userId },
          },
        ],
        where: {
          status: "completed",
        },
      });

      const wallet = await Wallet.findOne({
        where: { user_id: userId },
      });

      totalAmount = wallet ? parseFloat(wallet.total_spent) : 0;

      // Verified nếu đã hoàn thành >= 1 job (giảm từ 2 jobs)
      isVerified = completedJobsCount >= 1;
    }

    // Tạo review
    const review = await PlatformReview.create({
      user_id: userId,
      user_role,
      rating,
      comment,
      aspects: aspects || null,
      completed_jobs_count: completedJobsCount,
      total_earned: totalAmount,
      is_verified: isVerified,
      is_visible: true,
      status: "active",
    });

    res.status(201).json({
      success: true,
      message:
        "Cảm ơn bạn đã đánh giá! Góp ý của bạn rất quý giá với chúng tôi.",
      data: review,
    });
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({
      success: false,
      message: "Error creating review",
      error: error.message,
    });
  }
};

/**
 * Lấy danh sách đánh giá (public)
 * GET /api/platform-reviews
 */
exports.getReviews = async (req, res) => {
  try {
    const {
      user_role,
      rating,
      is_verified,
      page = 1,
      limit = 10,
      sort_by = "created_at",
      sort_dir = "DESC",
    } = req.query;

    const where = {
      status: "active",
      is_visible: true,
    };

    if (user_role) {
      where.user_role = user_role;
    }

    if (rating) {
      where.rating = parseInt(rating);
    }

    if (is_verified !== undefined) {
      where.is_verified = is_verified === "true";
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: reviews } = await PlatformReview.findAndCountAll({
      where,
      order: [[sort_by, sort_dir]],
      limit: parseInt(limit),
      offset,
    });

    // Tính thống kê tổng quan
    const stats = await PlatformReview.findAll({
      where: {
        status: "active",
        is_visible: true,
      },
      attributes: [
        [sequelize.fn("AVG", sequelize.col("rating")), "average_rating"],
        [sequelize.fn("COUNT", sequelize.col("id")), "total_reviews"],
        [
          sequelize.fn(
            "COUNT",
            sequelize.literal('CASE WHEN "is_verified" = true THEN 1 END')
          ),
          "verified_reviews",
        ],
      ],
      raw: true,
    });

    // Đếm theo rating
    const ratingDistribution = await PlatformReview.findAll({
      where: {
        status: "active",
        is_visible: true,
      },
      attributes: [
        "rating",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["rating"],
      raw: true,
    });

    res.status(200).json({
      success: true,
      data: {
        reviews,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / parseInt(limit)),
        },
        stats: {
          average_rating: parseFloat(stats[0]?.average_rating || 0).toFixed(1),
          total_reviews: parseInt(stats[0]?.total_reviews || 0),
          verified_reviews: parseInt(stats[0]?.verified_reviews || 0),
          rating_distribution: ratingDistribution.reduce((acc, item) => {
            acc[item.rating] = parseInt(item.count);
            return acc;
          }, {}),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching reviews",
      error: error.message,
    });
  }
};

/**
 * Lấy đánh giá của user hiện tại
 * GET /api/platform-reviews/my-review
 */
exports.getMyReview = async (req, res) => {
  try {
    const userId = req.userId;
    const { user_role } = req.query;

    if (!user_role || !["FREELANCER", "EMPLOYER"].includes(user_role)) {
      return res.status(400).json({
        success: false,
        message: "user_role is required (FREELANCER or EMPLOYER)",
      });
    }

    const review = await PlatformReview.findOne({
      where: {
        user_id: userId,
        user_role,
        status: "active",
      },
      order: [["created_at", "DESC"]],
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Bạn chưa đánh giá nền tảng này",
      });
    }

    res.status(200).json({
      success: true,
      data: review,
    });
  } catch (error) {
    console.error("Error fetching my review:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching review",
      error: error.message,
    });
  }
};

/**
 * Cập nhật đánh giá
 * PUT /api/platform-reviews/:reviewId
 */
exports.updateReview = async (req, res) => {
  try {
    const userId = req.userId;
    const { reviewId } = req.params;
    const { rating, comment, aspects } = req.body;

    const review = await PlatformReview.findOne({
      where: {
        id: reviewId,
        user_id: userId,
      },
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found or you don't have permission",
      });
    }

    // Validation
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: "rating must be between 1 and 5",
      });
    }

    // Update
    await review.update({
      rating: rating || review.rating,
      comment: comment !== undefined ? comment : review.comment,
      aspects: aspects !== undefined ? aspects : review.aspects,
    });

    res.status(200).json({
      success: true,
      message: "Đánh giá đã được cập nhật",
      data: review,
    });
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({
      success: false,
      message: "Error updating review",
      error: error.message,
    });
  }
};

/**
 * Xóa đánh giá
 * DELETE /api/platform-reviews/:reviewId
 */
exports.deleteReview = async (req, res) => {
  try {
    const userId = req.userId;
    const { reviewId } = req.params;

    const review = await PlatformReview.findOne({
      where: {
        id: reviewId,
        user_id: userId,
      },
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found or you don't have permission",
      });
    }

    // Soft delete - chỉ ẩn đi
    await review.update({
      is_visible: false,
      status: "removed",
    });

    res.status(200).json({
      success: true,
      message: "Đánh giá đã được xóa",
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting review",
      error: error.message,
    });
  }
};

/**
 * Đánh dấu đánh giá hữu ích
 * POST /api/platform-reviews/:reviewId/helpful
 */
exports.markHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await PlatformReview.findOne({
      where: {
        id: reviewId,
        status: "active",
        is_visible: true,
      },
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    await review.increment("helpful_count");

    res.status(200).json({
      success: true,
      message: "Cảm ơn phản hồi của bạn!",
      data: {
        helpful_count: review.helpful_count + 1,
      },
    });
  } catch (error) {
    console.error("Error marking review as helpful:", error);
    res.status(500).json({
      success: false,
      message: "Error processing request",
      error: error.message,
    });
  }
};

/**
 * Admin: Phản hồi đánh giá
 * PUT /api/admin/platform-reviews/:reviewId/response
 */
exports.adminResponse = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { admin_response } = req.body;

    const review = await PlatformReview.findByPk(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    await review.update({
      admin_response,
    });

    res.status(200).json({
      success: true,
      message: "Admin response added successfully",
      data: review,
    });
  } catch (error) {
    console.error("Error adding admin response:", error);
    res.status(500).json({
      success: false,
      message: "Error adding response",
      error: error.message,
    });
  }
};

/**
 * Admin: Ẩn/hiện đánh giá
 * PUT /api/admin/platform-reviews/:reviewId/visibility
 */
exports.toggleVisibility = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { is_visible } = req.body;

    const review = await PlatformReview.findByPk(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    await review.update({
      is_visible: is_visible !== undefined ? is_visible : !review.is_visible,
    });

    res.status(200).json({
      success: true,
      message: `Review ${review.is_visible ? "shown" : "hidden"}`,
      data: review,
    });
  } catch (error) {
    console.error("Error toggling visibility:", error);
    res.status(500).json({
      success: false,
      message: "Error updating visibility",
      error: error.message,
    });
  }
};
