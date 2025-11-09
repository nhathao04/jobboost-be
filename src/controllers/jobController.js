const { Job, Application, sequelize } = require("../models");
const { Op } = require("sequelize");
const walletController = require("./walletController");

// Create a new job posting (Client/Employer)
exports.createJob = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    // Get user from auth middleware
    const userId = req.userId; // Assuming Supabase auth middleware sets this

    const {
      title,
      description,
      // category_id không tồn tại trong database
      // category_id,
      job_type,
      budget_type,
      budget_min,
      budget_max,
      currency,
      experience_level,
      deadline,
      skills_required,
      post_cost, // Giá tiền đăng bài
    } = req.body;

    // Basic validation
    if (!title || !description || !job_type || !budget_type) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Validate post_cost
    if (!post_cost || post_cost <= 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Post cost is required and must be greater than 0",
      });
    }

    console.log(userId);

    // Trừ tiền từ ví trước khi tạo job
    let walletResult;
    try {
      walletResult = await walletController.deductMoneyForJobPost(
        userId,
        post_cost,
        null, // jobId sẽ được cập nhật sau khi tạo job
        transaction
      );
    } catch (walletError) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: walletError.message,
        error: "WALLET_ERROR",
      });
    }

    // Create job
    const job = await Job.create(
      {
        owner_id: userId,
        title,
        description,
        // category_id không tồn tại trong database
        // category_id,
        job_type,
        budget_type,
        budget_min,
        budget_max,
        currency,
        experience_level,
        deadline: deadline ? new Date(deadline) : null,
        skills_required: skills_required || [],
        post_cost, // Lưu chi phí đăng bài
        status: "pending", // Jobs need admin approval by default
      },
      { transaction }
    );

    // Cập nhật reference_id trong transaction
    await walletResult.transaction.update(
      { reference_id: job.id },
      { transaction }
    );

    await transaction.commit();

    res.status(201).json({
      success: true,
      message:
        "Job created successfully and awaiting approval. Money deducted from wallet.",
      data: {
        job,
        wallet_balance: walletResult.balance_after,
        amount_deducted: post_cost,
      },
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      success: false,
      message: "An error occurred while creating the job",
      error: error.message,
    });
  }
};

// Get all jobs with filters (Freelancer)
exports.getAllJobs = async (req, res) => {
  try {
    const {
      category_id,
      job_type,
      budget_min,
      budget_max,
      experience_level,
      skills,
      location,
      is_remote,
      page = 1,
      limit = 10,
      sort_by = "created_at",
      sort_dir = "DESC",
    } = req.query;

    const where = {
      status: "active",
    };

    if (job_type) where.job_type = job_type;
    if (experience_level) where.experience_level = experience_level;
    if (location) where.location = location;

    if (is_remote !== undefined) {
      where.is_remote = is_remote === "true";
    }

    // Budget range filter
    if (budget_min) where.budget_min = { [Op.gte]: parseFloat(budget_min) };
    if (budget_max) where.budget_max = { [Op.lte]: parseFloat(budget_max) };

    // Skills filter (if skills is a comma-separated list)
    if (skills) {
      const skillsArray = skills.split(",").map((s) => s.trim());
      where.skills_required = { [Op.overlap]: skillsArray };
    }

    const offset = (page - 1) * limit;

    // Get jobs
    const { count, rows: jobs } = await Job.findAndCountAll({
      where,
      order: [[sort_by, sort_dir]],
      limit,
      offset,
    });

    res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching jobs",
      error: error.message,
    });
  }
};

// Get job details by ID
exports.getJobById = async (req, res) => {
  try {
    const { jobId } = req.params;

    console.log(jobId);

    const job = await Job.findOne({
      where: {
        id: jobId,
      },
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Increment view count
    // await job.increment("views_count");

    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching the job",
      error: error.message,
    });
  }
};

// Update job posting (Client/Employer)
exports.updateJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.userId; // From auth middleware

    const job = await Job.findOne({
      where: { id: jobId },
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Check if user is the owner
    if (job.owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this job",
      });
    }

    // Allow updates only if job is in draft or pending status
    if (!["draft", "pending", "rejected"].includes(job.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot update job with status '${job.status}'`,
      });
    }

    // Update job fields
    const updateData = { ...req.body };

    // Don't allow changing owner or status directly
    delete updateData.owner_id;
    delete updateData.applications_count;
    delete updateData.views_count;

    // Set status back to pending if job was rejected
    if (job.status === "rejected") {
      updateData.status = "pending";
    }

    await job.update(updateData);

    res.status(200).json({
      success: true,
      message: "Job updated successfully and will be reviewed again",
      data: job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred while updating the job",
      error: error.message,
    });
  }
};

// Delete job posting (Client/Employer)
exports.deleteJob = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId; // From auth middleware

    const job = await Job.findOne({
      where: { id: id },
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Check if user is the owner
    if (job.owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this job",
      });
    }

    // Check if the job has applications
    const applicationsCount = await Application.count({
      where: { job_id: id },
    });

    if (applicationsCount > 0) {
      // Don't delete, just change status to cancelled
      await job.update({ status: "deleted" });

      return res.status(200).json({
        success: true,
        message:
          "Job has applications and cannot be deleted. Status changed to cancelled instead.",
      });
    }

    // // If no applications, delete the job
    // await job.destroy();

    res.status(200).json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while deleting the job",
      error: error.message,
    });
  }
};

// Get my posted jobs (Client/Employer)
exports.getMyJobs = async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware
    const { status, page = 1, limit = 10 } = req.query;
    console.log("userID: ", userId);
    // Build where clause
    const where = {
      owner_id: userId,
    };

    // Filter by status if provided
    if (status) where.status = status;

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Get jobs
    const { count, rows: jobs } = await Job.findAndCountAll({
      where,
      order: [["created_at", "DESC"]],
      limit,
      offset,
    });

    res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching your jobs",
      error: error.message,
    });
  }
};

// Admin: Approve/Reject job posting
exports.reviewJob = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { jobId } = req.params;
    const { status, rejection_reason } = req.body;

    // Validate status
    if (!["active", "rejected"].includes(status)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Status must be 'active' or 'rejected'",
      });
    }

    // Find job
    const job = await Job.findOne({
      where: { id: jobId },
      transaction,
    });

    if (!job) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Check if job is already processed
    if (job.status !== "pending") {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Job has already been ${job.status}. Cannot review again.`,
      });
    }

    let refundResult = null;

    // If rejected, refund money to employer's wallet
    if (status === "rejected") {
      try {
        refundResult = await walletController.refundJobPost(
          job.owner_id,
          job.post_cost,
          job.id,
          rejection_reason || "Job posting rejected by admin",
          transaction
        );
      } catch (walletError) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Failed to refund money to wallet",
          error: walletError.message,
        });
      }
    }

    // Update job status
    await job.update(
      {
        status,
        rejection_reason: status === "rejected" ? rejection_reason : null,
      },
      { transaction }
    );

    await transaction.commit();

    const responseData = {
      success: true,
      message: `Job has been ${status === "active" ? "approved" : "rejected"}`,
      data: {
        job,
      },
    };

    // Add refund info if rejected
    if (status === "rejected" && refundResult) {
      responseData.data.refund = {
        amount: job.post_cost,
        new_balance: refundResult.balance_after,
        transaction_id: refundResult.transaction.id,
      };
      responseData.message += `. Refunded ${job.post_cost} ${job.currency} to employer's wallet.`;
    }

    res.status(200).json(responseData);
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      success: false,
      message: "An error occurred while reviewing the job",
      error: error.message,
    });
  }
};

// Admin: Get jobs pending approval
exports.getPendingJobs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get pending jobs
    const { count, rows: jobs } = await Job.findAndCountAll({
      where: { status: "pending" },
      // include: [{ model: Category, as: "category" }],
      order: [["created_at", "ASC"]],
      limit,
      offset,
    });
    console.log(1);

    res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching pending jobs",
      error: error.message,
    });
  }
};
