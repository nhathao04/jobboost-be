const { Job, User, Category, Skill } = require("../models");
const { handleError } = require("../utils/helpers");

// Create a new job
exports.createJob = async (req, res) => {
  try {
    const job = await Job.create(req.body);
    res.status(201).json({ success: true, data: job });
  } catch (error) {
    handleError(res, error);
  }
};

// Get all jobs
exports.getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.findAll({
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
    res.status(200).json({ success: true, data: jobs });
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
