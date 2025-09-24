const { Application, Job, User, StudentProfile } = require("../models");
const { handleError } = require("../utils/helpers");

// Apply for a job
exports.applyForJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const {
      student_id,
      cover_letter,
      proposed_rate,
      proposed_timeline,
      portfolio_links,
    } = req.body;

    // Check if job exists
    const job = await Job.findByPk(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    // Check if user already applied
    const existingApplication = await Application.findOne({
      where: { job_id: jobId, student_id },
    });

    if (existingApplication) {
      return res
        .status(400)
        .json({
          success: false,
          message: "You have already applied for this job",
        });
    }

    const application = await Application.create({
      job_id: jobId,
      student_id,
      cover_letter,
      proposed_rate,
      proposed_timeline,
      portfolio_links,
      status: "pending",
    });

    res
      .status(201)
      .json({
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
