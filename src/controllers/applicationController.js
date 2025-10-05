const {
  Application,
  Job,
  User,
  StudentProfile,
  Category,
} = require("../models");
const { handleError } = require("../utils/helpers");

// Apply for a job (for freelancers/students)
exports.applyForJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { cover_letter, proposed_rate, proposed_timeline, portfolio_links } =
      req.body;

    // Get user from authentication
    const user = await User.findByPk(req.userId);

    if (!user || user.user_type !== "student") {
      return res.status(403).json({
        success: false,
        message: "Only students/freelancers can apply for jobs",
      });
    }

    // Find student profile
    const studentProfile = await user.getStudentProfile();
    if (!studentProfile) {
      return res.status(404).json({
        success: false,
        message:
          "Student profile not found. Please complete your profile first.",
      });
    }

    // Check if job exists and is approved
    const job = await Job.findOne({
      where: {
        id: jobId,
        approval_status: "approved",
        status: "active",
      },
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found or not available for applications",
      });
    }

    // Check if user already applied
    const existingApplication = await Application.findOne({
      where: {
        job_id: jobId,
        student_id: studentProfile.id,
      },
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: "You have already applied for this job",
      });
    }

    const application = await Application.create({
      job_id: jobId,
      student_id: studentProfile.id,
      cover_letter,
      proposed_rate,
      proposed_timeline,
      portfolio_links,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: application,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Get applications for a job
exports.getApplicationsForJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const applications = await Application.findAll({
      where: { job_id: jobId },
      include: [
        {
          model: User,
          as: "Student",
          attributes: ["id", "full_name", "email", "avatar_url"],
          include: [{ model: StudentProfile }],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    res.status(200).json({ success: true, data: applications });
  } catch (error) {
    handleError(res, error);
  }
};

// Get applications by student
exports.getApplicationsByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const applications = await Application.findAll({
      where: { student_id: studentId },
      include: [
        {
          model: Job,
          include: [
            { model: User, as: "Employer", attributes: ["id", "full_name"] },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    res.status(200).json({ success: true, data: applications });
  } catch (error) {
    handleError(res, error);
  }
};

// Update application status
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;

    const application = await Application.findByPk(applicationId);
    if (!application) {
      return res
        .status(404)
        .json({ success: false, message: "Application not found" });
    }

    const updatedApplication = await application.update({ status });

    res.status(200).json({
      success: true,
      message: "Application status updated",
      data: updatedApplication,
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
          include: [
            { model: User, as: "Employer", attributes: ["id", "full_name"] },
          ],
        },
        {
          model: User,
          as: "Student",
          attributes: ["id", "full_name", "email", "avatar_url"],
          include: [{ model: StudentProfile }],
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

// Get my applications (for students/freelancers)
exports.getMyApplications = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);

    if (!user || user.user_type !== "student") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Find student profile
    const studentProfile = await user.getStudentProfile();
    if (!studentProfile) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    // Get all applications for this student
    const applications = await Application.findAll({
      where: { student_id: studentProfile.id },
      include: [
        {
          model: Job,
          include: [
            {
              model: User,
              as: "Employer",
              attributes: ["id", "full_name", "avatar_url"],
            },
            { model: Category, attributes: ["id", "name"] },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: applications,
      count: applications.length,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Withdraw application (for students/freelancers)
exports.withdrawApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const user = await User.findByPk(req.userId);

    if (!user || user.user_type !== "student") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Find student profile
    const studentProfile = await user.getStudentProfile();
    if (!studentProfile) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    // Find application
    const application = await Application.findOne({
      where: {
        id: applicationId,
        student_id: studentProfile.id,
      },
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message:
          "Application not found or you don't have permission to withdraw it",
      });
    }

    // Only allow withdrawal if status is pending
    if (application.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot withdraw application with status: ${application.status}`,
      });
    }

    // Update status to withdrawn
    await application.update({ status: "withdrawn" });

    res.status(200).json({
      success: true,
      message: "Application successfully withdrawn",
    });
  } catch (error) {
    handleError(res, error);
  }
};
