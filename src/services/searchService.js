// src/services/searchService.js

const db = require('../config/database'); // Assuming you have a database connection setup
const Job = require('../models/Job');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const EmployerProfile = require('../models/EmployerProfile');

const searchJobs = async (query) => {
    try {
        const jobs = await Job.findAll({
            where: {
                title: {
                    [db.Sequelize.Op.iLike]: `%${query}%`
                }
            },
            include: [{
                model: EmployerProfile,
                include: [User]
            }]
        });
        return jobs;
    } catch (error) {
        throw new Error('Error searching for jobs: ' + error.message);
    }
};

const searchUsers = async (query) => {
    try {
        const users = await User.findAll({
            where: {
                [db.Sequelize.Op.or]: [
                    { full_name: { [db.Sequelize.Op.iLike]: `%${query}%` } },
                    { email: { [db.Sequelize.Op.iLike]: `%${query}%` } }
                ]
            },
            include: [{
                model: StudentProfile,
                required: false
            }, {
                model: EmployerProfile,
                required: false
            }]
        });
        return users;
    } catch (error) {
        throw new Error('Error searching for users: ' + error.message);
    }
};

module.exports = {
    searchJobs,
    searchUsers
};