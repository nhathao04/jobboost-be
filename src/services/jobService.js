const { Job, Application, Assignment, Skill } = require('../models'); // Import models

// Create a new job
const createJob = async (jobData) => {
    try {
        const job = await Job.create(jobData);
        return job;
    } catch (error) {
        throw new Error('Error creating job: ' + error.message);
    }
};

// Get all active jobs
const getAllJobs = async () => {
    try {
        const jobs = await Job.findAll({ where: { status: 'active' } });
        return jobs;
    } catch (error) {
        throw new Error('Error fetching jobs: ' + error.message);
    }
};

// Get job by ID
const getJobById = async (jobId) => {
    try {
        const job = await Job.findByPk(jobId);
        if (!job) {
            throw new Error('Job not found');
        }
        return job;
    } catch (error) {
        throw new Error('Error fetching job: ' + error.message);
    }
};

// Update a job
const updateJob = async (jobId, jobData) => {
    try {
        const job = await Job.findByPk(jobId);
        if (!job) {
            throw new Error('Job not found');
        }
        await job.update(jobData);
        return job;
    } catch (error) {
        throw new Error('Error updating job: ' + error.message);
    }
};

// Delete a job
const deleteJob = async (jobId) => {
    try {
        const job = await Job.findByPk(jobId);
        if (!job) {
            throw new Error('Job not found');
        }
        await job.destroy();
        return { message: 'Job deleted successfully' };
    } catch (error) {
        throw new Error('Error deleting job: ' + error.message);
    }
};

// Get required skills for a job
const getJobSkills = async (jobId) => {
    try {
        const skills = await Skill.findAll({
            include: {
                model: Job,
                where: { id: jobId },
                through: { attributes: [] } // Exclude join table attributes
            }
        });
        return skills;
    } catch (error) {
        throw new Error('Error fetching job skills: ' + error.message);
    }
};

module.exports = {
    createJob,
    getAllJobs,
    getJobById,
    updateJob,
    deleteJob,
    getJobSkills
};