const { Application, Job, FreelancerProfile, sequelize } = require("../models");
const { handleError } = require("../utils/helpers");
const { Op } = require("sequelize");

// Apply for a job (Freelancer)
exports.applyForJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    // const userId = req.user.id; // From auth middleware
    const userId = "6c23bafd-d79b-4a71-a7e8-cfd04e2bd405"; // From auth middleware

    const { cover_letter, proposed_rate, proposed_timeline, portfolio_links } =
      req.body;

    // Find the job
    const job = await Job.findOne({
      where: {
        id: jobId,
        status: "active", // Can only apply to active jobs
      },
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found or not available for applications",
      });
    }

    // Check if user is not applying to their own job
    if (job.owner_id === userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot apply to your own job",
      });
    }

    // Check if already applied
    const existingApplication = await Application.findOne({
      where: {
        job_id: jobId,
        applicant_id: userId,
      },
    });
    console.log(1)

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: "You have already applied for this job",
      });
    }

    // Create application
    const application = await Application.create({
      job_id: jobId,
      applicant_id: userId,
      cover_letter,
      proposed_rate,
      proposed_timeline,
      portfolio_links: portfolio_links || [],
      status: "pending",
    });
    console.log(2)

    // Increment applications_count on job
    await job.increment("applications_count");

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: application,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred while submitting the application",
    });
  }
};

// Get my applications (Freelancer)
exports.getMyApplications = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware
    const { status, page = 1, limit = 10 } = req.query;

    // Build where clause
    const where = {
      applicant_id: userId,
    };

    // Filter by status if provided
    if (status) where.status = status;

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Get applications
    const { count, rows: applications } = await Application.findAndCountAll({
      where,
      include: [
        {
          model: Job,
          as: "job",
          // Category đã bị comment vì không có liên kết
          // include: [{ model: Category, as: "category" }],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    res.status(200).json({
      success: true,
      data: applications,
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

// Withdraw application (Freelancer)
exports.withdrawApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user.id; // From auth middleware

    const application = await Application.findOne({
      where: {
        id: applicationId,
        applicant_id: userId,
      },
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message:
          "Application not found or you do not have permission to withdraw it",
      });
    }

    // Check if application can be withdrawn (only pending applications)
    if (application.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot withdraw application with status '${application.status}'`,
      });
    }

    // Update application status to withdrawn
    await application.update({ status: "WITHDRAWN" });

    res.status(200).json({
      success: true,
      message: "Application withdrawn successfully",
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Get applications for a job (Employer)
exports.getApplicationsForJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id; // From auth middleware

    // Find the job to check ownership
    const job = await Job.findOne({
      where: { id: jobId },
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Check if user is the job owner
    if (job.owner_id !== userId && !req.user.is_admin) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view applications for this job",
      });
    }

    // Get applications with pagination
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const where = { job_id: jobId };
    if (status) where.status = status;

    // Get applications
    const { count, rows: applications } = await Application.findAndCountAll({
      where,
      // Note: FreelancerProfile association might need to be set up in application.model.js
      // include: [
      //   {
      //     model: FreelancerProfile,
      //     as: "freelancer",
      //     attributes: [
      //       "id",
      //       "title",
      //       "skills",
      //       "experience_level",
      //       "hourly_rate",
      //     ],
      //   },
      // ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    res.status(200).json({
      success: true,
      data: applications,
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

// Update application status (Employer)
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, employer_notes } = req.body;
    const userId = req.user.id; // From auth middleware

    // Validate status
    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'ACCEPTED' or 'REJECTED'",
      });
    }

    // Find application
    const application = await Application.findByPk(applicationId, {
      include: [{ model: Job, as: "job" }],
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Check if user is the job owner
    if (application.job.owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this application",
      });
    }

    // Update application
    await application.update({
      status,
      employer_notes: employer_notes || application.employer_notes,
    });

    res.status(200).json({
      success: true,
      message: `Application ${status} successfully`,
      data: application,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Get application details
exports.getApplicationDetail = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user.id; // From auth middleware

    const application = await Application.findByPk(applicationId, {
      include: [{ model: Job, as: "job" }],
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Check if user is authorized (either the applicant or the job owner)
    if (
      application.applicant_id !== userId &&
      application.job.owner_id !== userId &&
      !req.user.is_admin
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this application",
      });
    }

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Get application by ID
exports.getApplicationById = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await Application.findByPk(applicationId, {
      include: [
        {
          model: Job,
        },
        {
          model: User,
          as: "Student",
          attributes: ["id", "full_name", "email", "avatar_url"],
        },
      ],
    });

    if (!application) {
      return res
        .status(404)
        .json({ success: false, message: "Application not found" });
    }

    res.status(200).json({ success: true, data: application });
  } catch (error) {
    handleError(res, error);
  }
};

// Delete application
exports.deleteApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await Application.findByPk(applicationId);
    if (!application) {
      return res
        .status(404)
        .json({ success: false, message: "Application not found" });
    }

    await application.destroy();

    res
      .status(200)
      .json({ success: true, message: "Application deleted successfully" });
  } catch (error) {
    handleError(res, error);
  }
};
