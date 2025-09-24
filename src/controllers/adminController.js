const { User, Job, Application, Assignment, Transaction } = require('../models');
const { handleError } = require('../utils/helpers');

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User.count();
        const totalJobs = await Job.count();
        const totalApplications = await Application.count();
        const totalAssignments = await Assignment.count();
        const totalTransactions = await Transaction.count();

        const stats = {
            total_users: totalUsers,
            total_jobs: totalJobs,
            total_applications: totalApplications,
            total_assignments: totalAssignments,
            total_transactions: totalTransactions
        };

        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        handleError(res, error);
    }
};

// Get all users for admin
exports.getAllUsers = async (req, res) => {
    try {
        const { limit = 50, offset = 0, user_type } = req.query;

        const whereClause = {};
        if (user_type) {
            whereClause.user_type = user_type;
        }

        const users = await User.findAndCountAll({
            where: whereClause,
            attributes: { exclude: ['password'] },
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.status(200).json({ 
            success: true, 
            data: users.rows,
            total: users.count,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                total: users.count
            }
        });
    } catch (error) {
        handleError(res, error);
    }
};

// Get all jobs for admin
exports.getAllJobs = async (req, res) => {
    try {
        const { limit = 50, offset = 0, status } = req.query;

        const whereClause = {};
        if (status) {
            whereClause.status = status;
        }

        const jobs = await Job.findAndCountAll({
            where: whereClause,
            include: [
                { model: User, as: 'Employer', attributes: ['id', 'full_name', 'email'] }
            ],
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.status(200).json({ 
            success: true, 
            data: jobs.rows,
            total: jobs.count,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                total: jobs.count
            }
        });
    } catch (error) {
        handleError(res, error);
    }
};

// Ban/Unban user
exports.toggleUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { is_active } = req.body;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        await user.update({ is_active });

        res.status(200).json({ 
            success: true, 
            message: `User ${is_active ? 'activated' : 'deactivated'} successfully`,
            data: user
        });
    } catch (error) {
        handleError(res, error);
    }
};

exports.getApplicationAnalytics = async (req, res) => {
    try {
        const applications = await Application.find();
        const totalApplications = applications.length;
        const acceptedApplications = applications.filter(app => app.status === 'accepted').length;

        res.status(200).json({
            totalApplications,
            acceptedApplications
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching application analytics', error });
    }
};

exports.getAssignmentAnalytics = async (req, res) => {
    try {
        const assignments = await Assignment.find();
        const totalAssignments = assignments.length;
        const completedAssignments = assignments.filter(assign => assign.status === 'completed').length;

        res.status(200).json({
            totalAssignments,
            completedAssignments
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching assignment analytics', error });
    }
};

exports.getTransactionAnalytics = async (req, res) => {
    try {
        const transactions = await Transaction.find();
        const totalTransactions = transactions.length;
        const totalRevenue = transactions.reduce((acc, transaction) => acc + transaction.gross_amount, 0);

        res.status(200).json({
            totalTransactions,
            totalRevenue
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching transaction analytics', error });
    }
};

exports.getOverallAnalytics = async (req, res) => {
    try {
        const userAnalytics = await this.getUserAnalytics(req, res);
        const jobAnalytics = await this.getJobAnalytics(req, res);
        const applicationAnalytics = await this.getApplicationAnalytics(req, res);
        const assignmentAnalytics = await this.getAssignmentAnalytics(req, res);
        const transactionAnalytics = await this.getTransactionAnalytics(req, res);

        res.status(200).json({
            userAnalytics,
            jobAnalytics,
            applicationAnalytics,
            assignmentAnalytics,
            transactionAnalytics
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching overall analytics', error });
    }
};

// Get user by ID
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const user = await User.findByPk(id, {
            include: [
                { model: StudentProfile, as: 'studentProfile' },
                { model: EmployerProfile, as: 'employerProfile' }
            ]
        });
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        handleError(res, error);
    }
};

// Update user
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, email, user_type, status } = req.body;
        
        const user = await User.findByPk(id);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        await user.update({
            full_name: full_name || user.full_name,
            email: email || user.email,
            user_type: user_type || user.user_type,
            status: status !== undefined ? status : user.status
        });
        
        res.status(200).json({ success: true, data: user, message: 'User updated successfully' });
    } catch (error) {
        handleError(res, error);
    }
};

// Delete user
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        const user = await User.findByPk(id);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        await user.destroy();
        
        res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        handleError(res, error);
    }
};

// Delete job
exports.deleteJob = async (req, res) => {
    try {
        const { id } = req.params;
        
        const job = await Job.findByPk(id);
        
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }
        
        await job.destroy();
        
        res.status(200).json({ success: true, message: 'Job deleted successfully' });
    } catch (error) {
        handleError(res, error);
    }
};