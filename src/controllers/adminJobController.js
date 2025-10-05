// Get pending jobs for approval
exports.getPendingJobs = async (req, res) => {
  try {
    const jobs = await Job.findAll({
      where: { approval_status: "pending" },
      include: [
        {
          model: EmployerProfile,
          as: "Employer",
          include: [
            {
              model: User,
              as: "User",
              attributes: ["id", "full_name", "email", "avatar_url"],
            },
          ],
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

// Approve or reject a job
exports.reviewJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { approval_status, rejection_reason } = req.body;

    // Validate approval status
    if (!["approved", "rejected"].includes(approval_status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid approval status. Must be 'approved' or 'rejected'.",
      });
    }

    // Check if job exists
    const job = await Job.findByPk(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Update job approval status
    const updateData = { approval_status };

    // Add rejection reason if job is rejected
    if (approval_status === "rejected" && rejection_reason) {
      updateData.rejection_reason = rejection_reason;
    }

    await job.update(updateData);

    // Send notification to employer (placeholder for actual notification)
    console.log(`Job ${jobId} ${approval_status} by admin ${req.userId}`);

    res.status(200).json({
      success: true,
      message: `Job has been ${approval_status}`,
      data: job,
    });
  } catch (error) {
    handleError(res, error);
  }
};
