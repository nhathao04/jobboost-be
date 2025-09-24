const Assignment = require('../models/Assignment');
const Job = require('../models/Job');
const StudentProfile = require('../models/StudentProfile');
const { Op } = require('sequelize');

// Create a new assignment
const createAssignment = async (data) => {
    const { jobId, studentId, agreedRate, agreedTimeline, startDate, expectedEndDate } = data;

    const assignment = await Assignment.create({
        job_id: jobId,
        student_id: studentId,
        agreed_rate: agreedRate,
        agreed_timeline: agreedTimeline,
        start_date: startDate,
        expected_end_date: expectedEndDate,
        status: 'active'
    });

    return assignment;
};

// Get assignments by student ID
const getAssignmentsByStudentId = async (studentId) => {
    const assignments = await Assignment.findAll({
        where: {
            student_id: studentId
        },
        include: [
            {
                model: Job,
                required: true
            }
        ]
    });

    return assignments;
};

// Update assignment status
const updateAssignmentStatus = async (assignmentId, status) => {
    const assignment = await Assignment.findByPk(assignmentId);
    if (!assignment) {
        throw new Error('Assignment not found');
    }

    assignment.status = status;
    await assignment.save();

    return assignment;
};

// Get assignment details
const getAssignmentDetails = async (assignmentId) => {
    const assignment = await Assignment.findByPk(assignmentId, {
        include: [
            {
                model: Job,
                required: true
            },
            {
                model: StudentProfile,
                required: true
            }
        ]
    });

    if (!assignment) {
        throw new Error('Assignment not found');
    }

    return assignment;
};

// Delete an assignment
const deleteAssignment = async (assignmentId) => {
    const assignment = await Assignment.findByPk(assignmentId);
    if (!assignment) {
        throw new Error('Assignment not found');
    }

    await assignment.destroy();
    return { message: 'Assignment deleted successfully' };
};

module.exports = {
    createAssignment,
    getAssignmentsByStudentId,
    updateAssignmentStatus,
    getAssignmentDetails,
    deleteAssignment
};