const { Application, Job, FreelancerProfile, CV, sequelize } = require("../models");
const { Op } = require("sequelize");
const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase client (if configured)
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// Apply for a job (Freelancer)
exports.applyForJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.userId; // From auth middleware

    // If user haven't any CV, block apply
    const cvCount = await CV.count({
      where: { user_id: userId, status: 'active' }
    });
    if (cvCount === 0) {
      return res.status(400).json({
        success: false,
        message: "You must upload at least one active CV before applying for jobs",
      });
    }

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
      status: "pending",
    });

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
      error: error.message,
    });
  }
};

// Get my applications (Freelancer)
exports.getMyApplications = async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware
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
    res.status(500).json({
      success: false,
      message: "An error occurred while getting the applications",
      error: error.message,
    });
  }
};

// Withdraw application (Freelancer)
exports.withdrawApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = req.userId; // From auth middleware

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
    return res.status(500).json({
      success: false,
      message: "An error occurred while withdrawing the application",
      error: error.message,
    });
  }
};

// Get applications for a job (Employer)
exports.getApplicationsForJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.userId; // From auth middleware

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

    // Get applications with user info
    const { count, rows: applications } = await Application.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    // For each application, get user info from Supabase and CV
    const applicationsWithUser = await Promise.all(
      applications.map(async (app) => {
        const appData = app.toJSON();
        
        // Get primary CV for this applicant
        const primaryCV = await CV.findOne({
          where: {
            user_id: appData.applicant_id,
            status: 'active'
          },
          attributes: ['id', 'name', 'file_name', 'file_path']
        });

        console.log(primaryCV);

        // Get user info from Supabase
        let fullName = null;
        if (supabase) {
          try {
            const { data: userData, error } = await supabase.auth.admin.getUserById(
              appData.applicant_id
            );
            
            if (!error && userData?.user) {
              // Try to get full_name from user_metadata or raw_user_meta_data
              fullName = 
                userData.user.user_metadata?.full_name || 
                userData.user.user_metadata?.name ||
                userData.user.raw_user_meta_data?.full_name ||
                userData.user.raw_user_meta_data?.name ||
                userData.user.email?.split('@')[0] || // Fallback to email username
                null;
            }
          } catch (supabaseError) {
            console.error('Error fetching user from Supabase:', supabaseError);
            // Continue without user data
          }
        }

        // Add user object with full_name and cv
        return {
          ...appData,
          user: {
            full_name: fullName,
            cv: primaryCV ? {
              id: primaryCV.id,
              name: primaryCV.name,
              file_name: primaryCV.file_name
            } : null
          }
        };
      })
    );

    res.status(200).json({
      success: true,
      data: applicationsWithUser,
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
      message: "An error occurred while getting the applications",
      error: error.message,
    });
  }
};

// Update application status (Employer)
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, employer_notes } = req.body;
    const userId = req.userId; // From auth middleware

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
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating the application status",
      error: error.message,
    });
  }
};

// Get application details
exports.getApplicationDetail = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = req.userId; // From auth middleware

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
    return res.status(500).json({
      success: false,
      message: "An error occurred while getting the application details",
      error: error.message,
    });
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
    return res.status(500).json({
      success: false,
      message: "An error occurred while getting the application",
      error: error.message,
    });
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
    return res.status(500).json({
      success: false,
      message: "An error occurred while deleting the application",
      error: error.message,
    });
  }
};
