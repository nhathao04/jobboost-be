const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const EmployerProfile = require('../models/EmployerProfile');

// Get user by ID
const getUserById = async (userId) => {
    try {
        const user = await User.findByPk(userId);
        return user;
    } catch (error) {
        throw new Error('Error fetching user');
    }
};

// Update user information
const updateUser = async (userId, updateData) => {
    try {
        const user = await User.findByPk(userId);
        if (!user) {
            throw new Error('User not found');
        }
        await user.update(updateData);
        return user;
    } catch (error) {
        throw new Error('Error updating user');
    }
};

// Get student profile by user ID
const getStudentProfile = async (userId) => {
    try {
        const profile = await StudentProfile.findOne({ where: { user_id: userId } });
        return profile;
    } catch (error) {
        throw new Error('Error fetching student profile');
    }
};

// Get employer profile by user ID
const getEmployerProfile = async (userId) => {
    try {
        const profile = await EmployerProfile.findOne({ where: { user_id: userId } });
        return profile;
    } catch (error) {
        throw new Error('Error fetching employer profile');
    }
};

// Exporting the service functions
module.exports = {
    getUserById,
    updateUser,
    getStudentProfile,
    getEmployerProfile,
};