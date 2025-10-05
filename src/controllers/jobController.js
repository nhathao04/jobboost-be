const {
  Job,
  User,
  Category,
  Skill,
  EmployerProfile,
  Application,
} = require("../models");
const { Op } = require("sequelize");
const { handleError } = require("../utils/helpers");

// Create a new job (for employers)
exports.createJob = async (req, res) => {
  try {
    // Get employer profile ID from authenticated user
    const user = await User.findByPk(req.userId);

    if (!user || user.user_type !== "employer") {
      return res.status(403).json({
        success: false,
        message: "Only employers can post jobs",
      });
    }

    // Find employer profile
    const employerProfile = await user.getEmployerProfile();
    if (!employerProfile) {
      return res.status(404).json({
        success: false,
        message: "Employer profile not found",
      });
    }

    // Create job with employer ID and pending approval status
    const jobData = {
      ...req.body,
      employer_id: employerProfile.id,
      approval_status: "pending", // Set default to pending for admin review
    };

    const job = await Job.create(jobData);
    res.status(201).json({
      success: true,
      data: job,
      message: "Job created successfully and sent for approval",
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Get all jobs with filters (for freelancers)
exports.getAllJobs = async (req, res) => {
  try {
    const {
      location,
      category_id,
      is_remote,
      job_type,
      budget_min,
      budget_max,
    } = req.query;

    // Build filter criteria
    const whereClause = {
      approval_status: "approved", // Only show approved jobs
      status: "active", // Only show active jobs
    };

    // Apply optional filters
    if (location) {
      whereClause.location = location;
    }

    if (category_id) {
      whereClause.category_id = category_id;
    }

    if (is_remote !== undefined) {
      whereClause.is_remote = is_remote === "true";
    }

    if (job_type) {
      whereClause.job_type = job_type;
    }

    if (budget_min) {
      whereClause.budget_min = { [Op.gte]: parseFloat(budget_min) };
    }

    if (budget_max) {
      whereClause.budget_max = { [Op.lte]: parseFloat(budget_max) };
    }

    // Fetch jobs with filters
    const jobs = await Job.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "Employer",
          attributes: ["id", "full_name", "avatar_url"],
        },
        { model: Category, attributes: ["id", "name"] },
      ],
      order: [["created_at", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: jobs,
      count: jobs.length,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Get a job by ID
exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "Employer",
          attributes: ["id", "full_name", "avatar_url", "email"],
        },
        { model: Category, attributes: ["id", "name"] },
        { model: Skill, attributes: ["id", "name"] },
      ],
    });

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    res.status(200).json({ success: true, data: job });
  } catch (error) {
    handleError(res, error);
  }
};

// Update a job
exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.id);

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    const updatedJob = await job.update(req.body);
    res.status(200).json({ success: true, data: updatedJob });
  } catch (error) {
    handleError(res, error);
  }
};

// Delete a job
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.id);

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    await job.destroy();
    res
      .status(200)
      .json({ success: true, message: "Job deleted successfully" });
  } catch (error) {
    handleError(res, error);
  }
};
