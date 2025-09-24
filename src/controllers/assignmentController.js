const { Assignment, Application, User, Job } = require("../models");
const { handleError } = require("../utils/helpers");

// Create a new assignment
exports.createAssignment = async (req, res) => {
  try {
    const {
      job_id,
      student_id,
      agreed_rate,
      agreed_timeline,
      start_date,
      expected_end_date,
    } = req.body;

    const assignment = await Assignment.create({
      job_id,
      student_id,
      agreed_rate,
      agreed_timeline,
      start_date,
      expected_end_date,
    });

    res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    handleError(res, error);
  }
};

// Get assignment by ID
exports.getAssignmentById = async (req, res) => {
  try {
    const assignment = await Assignment.findByPk(req.params.id);

    if (!assignment) {
      return res
        .status(404)
        .json({ success: false, message: "Assignment not found" });
    }

    res.status(200).json({ success: true, data: assignment });
  } catch (error) {
    handleError(res, error);
  }
};

// Update an assignment
exports.updateAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findByPk(req.params.id);

    if (!assignment) {
      return res
        .status(404)
        .json({ success: false, message: "Assignment not found" });
    }

    const updatedAssignment = await assignment.update(req.body);

    res.status(200).json({ success: true, data: updatedAssignment });
  } catch (error) {
    handleError(res, error);
  }
};

// Delete an assignment
exports.deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findByPk(req.params.id);

    if (!assignment) {
      return res
        .status(404)
        .json({ success: false, message: "Assignment not found" });
    }

    await assignment.destroy();

    res
      .status(204)
      .json({ success: true, message: "Assignment deleted successfully" });
  } catch (error) {
    handleError(res, error);
  }
};

// Get all assignments for a student
exports.getAssignmentsByStudent = async (req, res) => {
  try {
    const assignments = await Assignment.findAll({
      where: { student_id: req.params.studentId },
    });

    res.status(200).json({ success: true, data: assignments });
  } catch (error) {
    handleError(res, error);
  }
};

// Get all assignments for an employer
exports.getAssignmentsByEmployer = async (req, res) => {
  try {
    const assignments = await Assignment.findAll({
      include: [
        {
          model: Job,
          where: { employer_id: req.params.employerId },
        },
      ],
    });

    res.status(200).json({ success: true, data: assignments });
  } catch (error) {
    handleError(res, error);
  }
};

// Get assignment details
exports.getAssignmentDetails = async (req, res) => {
  try {
    const assignment = await Assignment.findByPk(req.params.assignmentId, {
      include: [{ model: Job }, { model: User, as: "Student" }],
    });

    if (!assignment) {
      return res
        .status(404)
        .json({ success: false, message: "Assignment not found" });
    }

    res.status(200).json({ success: true, data: assignment });
  } catch (error) {
    handleError(res, error);
  }
};

// Get all assignments for a student (legacy function)
exports.getAssignmentsForStudent = async (req, res) => {
  try {
    const assignments = await Assignment.findAll({
      where: { student_id: req.params.studentId },
    });

    res.status(200).json({ success: true, data: assignments });
  } catch (error) {
    handleError(res, error);
  }
};

// Accept an application and create an assignment
exports.acceptApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await Application.findByPk(applicationId);

    if (!application) {
      return res
        .status(404)
        .json({ success: false, message: "Application not found" });
    }

    const assignment = await Assignment.create({
      job_id: application.job_id,
      student_id: application.student_id,
      agreed_rate: application.proposed_rate,
      agreed_timeline: application.proposed_timeline,
      start_date: new Date(),
      expected_end_date: new Date(
        Date.now() + application.proposed_timeline * 24 * 60 * 60 * 1000
      ), // Add proposed timeline in days
    });

    res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    handleError(res, error);
  }
};
