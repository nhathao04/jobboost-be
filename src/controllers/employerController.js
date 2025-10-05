// Get all applications for a specific job (for employers)
exports.getJobApplications = async (req, res) => {
  try {
    const { jobId } = req.params;
    const user = await User.findByPk(req.userId);

    if (!user || user.user_type !== "employer") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only employers can view job applications.",
      });
    }

    // Get employer profile
    const employerProfile = await user.getEmployerProfile();
    if (!employerProfile) {
      return res.status(404).json({
        success: false,
        message: "Employer profile not found",
      });
    }

    // Check if the job belongs to this employer
    const job = await Job.findOne({
      where: {
        id: jobId,
        employer_id: employerProfile.id,
      },
    });

    if (!job) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You can only view applications for your own jobs.",
      });
    }

    // Get applications with student profiles
    const applications = await Application.findAll({
      where: { job_id: jobId },
      include: [
        {
          model: StudentProfile,
          as: "Student",
          include: [
            {
              model: User,
              as: "User",
              attributes: ["id", "full_name", "email", "avatar_url", "phone"],
            },
          ],
        },
      ],
      order: [["applied_at", "DESC"]],
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

// Get application detail by ID (for employers)
exports.getApplicationDetail = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const user = await User.findByPk(req.userId);

    if (!user || user.user_type !== "employer") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only employers can view application details.",
      });
    }

    // Get employer profile
    const employerProfile = await user.getEmployerProfile();
    if (!employerProfile) {
      return res.status(404).json({
        success: false,
        message: "Employer profile not found",
      });
    }

    // Find application with related data
    const application = await Application.findOne({
      where: { id: applicationId },
      include: [
        {
          model: Job,
          where: { employer_id: employerProfile.id }, // Ensure job belongs to this employer
          required: true,
        },
        {
          model: StudentProfile,
          as: "Student",
          include: [
            {
              model: User,
              as: "User",
              attributes: ["id", "full_name", "email", "avatar_url", "phone"],
            },
          ],
        },
      ],
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message:
          "Application not found or you don't have permission to view it.",
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

// Update application status (for employers)
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, rejection_reason, employer_notes } = req.body;
    const user = await User.findByPk(req.userId);

    // Validate status
    if (!["pending", "accepted", "rejected", "withdrawn"].includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid status. Must be one of: pending, accepted, rejected, withdrawn",
      });
    }

    if (!user || user.user_type !== "employer") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only employers can update application status.",
      });
    }

    // Get employer profile
    const employerProfile = await user.getEmployerProfile();
    if (!employerProfile) {
      return res.status(404).json({
        success: false,
        message: "Employer profile not found",
      });
    }

    // Find application and ensure it belongs to a job owned by this employer
    const application = await Application.findOne({
      where: { id: applicationId },
      include: [
        {
          model: Job,
          where: { employer_id: employerProfile.id },
          required: true,
        },
      ],
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message:
          "Application not found or you don't have permission to update it.",
      });
    }

    // Update application
    const updatedData = {
      status,
      reviewed_at: new Date(),
    };

    // Add optional fields if provided
    if (rejection_reason) {
      updatedData.rejection_reason = rejection_reason;
    }

    if (employer_notes) {
      updatedData.employer_notes = employer_notes;
    }

    await application.update(updatedData);

    res.status(200).json({
      success: true,
      message: `Application status updated to ${status}`,
      data: application,
    });
  } catch (error) {
    handleError(res, error);
  }
};
