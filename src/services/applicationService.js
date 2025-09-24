// src/services/applicationService.js

const { Application, Job, StudentProfile } = require('../models');

// Create a new application
const createApplication = async (jobId, studentId, coverLetter, proposedRate, proposedTimeline, portfolioLinks) => {
    try {
        const application = await Application.create({
            job_id: jobId,
            student_id: studentId,
            cover_letter: coverLetter,
            proposed_rate: proposedRate,
            proposed_timeline: proposedTimeline,
            portfolio_links: portfolioLinks,
        });
        return application;
    } catch (error) {
        throw new Error('Error creating application: ' + error.message);
    }
};

// Get all applications for a job
const getApplicationsForJob = async (jobId) => {
    try {
        const applications = await Application.findAll({
            where: { job_id: jobId },
            include: [{ model: StudentProfile, attributes: ['full_name', 'avatar_url'] }],
        });
        return applications;
    } catch (error) {
        throw new Error('Error fetching applications: ' + error.message);
    }
};

// Update application status
const updateApplicationStatus = async (applicationId, status) => {
    try {
        const application = await Application.findByPk(applicationId);
        if (!application) {
            throw new Error('Application not found');
        }
        application.status = status;
        await application.save();
        return application;
    } catch (error) {
        throw new Error('Error updating application status: ' + error.message);
    }
};

// Withdraw an application
const withdrawApplication = async (applicationId) => {
    try {
        const application = await Application.findByPk(applicationId);
        if (!application) {
            throw new Error('Application not found');
        }
        application.status = 'withdrawn';
        await application.save();
        return application;
    } catch (error) {
        throw new Error('Error withdrawing application: ' + error.message);
    }
};

module.exports = {
    createApplication,
    getApplicationsForJob,
    updateApplicationStatus,
    withdrawApplication,
};