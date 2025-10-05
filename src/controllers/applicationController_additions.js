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
              model: EmployerProfile,
              as: "Employer",
              attributes: ["id", "company_name"],
            },
            { model: Category, attributes: ["id", "name"] },
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
