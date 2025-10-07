const { Job, Application, sequelize } = require("../models");
const { handleError } = require("../utils/helpers");
const { Op } = require("sequelize");

// Create a new job posting (Client/Employer)
exports.createJob = async (req, res) => {
  try {
    // Get user from auth middleware
    const userId = "970ac06d-3762-4ba3-aa8d-c95637a49fc4"; // Assuming Supabase auth middleware sets this

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
    } = req.body;

    // Basic validation
    if (!title || !description || !job_type || !budget_type) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Create job
    const job = await Job.create({
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
      status: "pending", // Jobs need admin approval by default
    });

    res.status(201).json({
      success: true,
      message: "Job created successfully and awaiting approval",
      data: job,
    });
  } catch (error) {
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

    // Build where clause
    const where = {
      status: "active", // Only show approved jobs
    };

    // Apply filters
    // category_id đã bị comment vì không có trong database
    // if (category_id) where.category_id = category_id;
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

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Get jobs
    const { count, rows: jobs } = await Job.findAndCountAll({
      where,
      // Category đã bị comment vì không có liên kết
      // include: [
      //   { model: Category, as: "category" }
      // ],
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
    const { id } = req.params;

    const job = await Job.findOne({
      where: {
        id: id,
        status: "active", // Only return active jobs
      },
      // Category đã bị comment vì không có liên kết
      // include: [
      //   { model: Category, as: "category" }
      // ],
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Increment view count
    await job.increment("views_count");

    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Update job posting (Client/Employer)
exports.updateJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = "970ac06d-3762-4ba3-aa8d-c95637a49fc4"; // From auth middleware

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
    const userId = req.user.id; // From auth middleware

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
    handleError(res, error);
  }
};

// Get my posted jobs (Client/Employer)
exports.getMyJobs = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware
    const { status, page = 1, limit = 10 } = req.query;

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
      include: [{ model: Category, as: "category" }],
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
    handleError(res, error);
  }
};

// Admin: Approve/Reject job posting
exports.reviewJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status, rejection_reason } = req.body;

    // // Only admin can approve/reject jobs
    // if (!req.user.is_admin) {
    //   return res.status(403).json({
    //     success: false,
    //     message: "Only administrators can approve or reject jobs",
    //   });
    // }

    // Validate status
    if (!["active", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'active' or 'rejected'",
      });
    }

    // Find job
    const job = await Job.findOne({
      where: { id: jobId },
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Update job status
    await job.update({
      status,
      rejection_reason: status === "rejected" ? rejection_reason : null,
    });

    res.status(200).json({
      success: true,
      message: `Job has been ${status === "active" ? "approved" : "rejected"}`,
      data: job,
    });
  } catch (error) {
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
    // Only admin can see pending jobs
    // if (!req.user.is_admin) {
    //   return res.status(403).json({
    //     success: false,
    //     message: "Only administrators can view pending jobs",
    //   });
    // }

    const { page, limit } = req.query;
    const offset = (page - 1) * limit;

    // Get pending jobs
    const { count, rows: jobs } = await Job.findAndCountAll({
      where: { status: "pending" },
      // include: [{ model: Category, as: "category" }],
      order: [["created_at", "ASC"]],
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
      message: "An error occurred while fetching pending jobs",
      error: error.message,
    });
  }
};
