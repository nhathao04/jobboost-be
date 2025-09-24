// src/services/analyticsService.js

const db = require('../config/database'); // Assuming you have a database connection setup

const AnalyticsService = {
    getDailyAnalytics: async (date) => {
        const query = `
            SELECT 
                new_users_count,
                new_jobs_count,
                completed_jobs_count,
                total_revenue,
                platform_fees_collected,
                premium_revenue,
                active_users_count,
                job_success_rate
            FROM analytics_daily
            WHERE date = $1
        `;
        const values = [date];
        const result = await db.query(query, values);
        return result.rows[0] || null;
    },

    getMonthlyAnalytics: async (startDate, endDate) => {
        const query = `
            SELECT 
                date,
                SUM(new_users_count) AS new_users_count,
                SUM(new_jobs_count) AS new_jobs_count,
                SUM(completed_jobs_count) AS completed_jobs_count,
                SUM(total_revenue) AS total_revenue,
                SUM(platform_fees_collected) AS platform_fees_collected,
                SUM(premium_revenue) AS premium_revenue,
                SUM(active_users_count) AS active_users_count,
                AVG(job_success_rate) AS job_success_rate
            FROM analytics_daily
            WHERE date BETWEEN $1 AND $2
            GROUP BY date
            ORDER BY date
        `;
        const values = [startDate, endDate];
        const result = await db.query(query, values);
        return result.rows;
    },

    getTotalUsers: async () => {
        const query = `
            SELECT COUNT(*) AS total_users
            FROM users
            WHERE is_active = true
        `;
        const result = await db.query(query);
        return parseInt(result.rows[0].total_users, 10);
    },

    getTotalJobs: async () => {
        const query = `
            SELECT COUNT(*) AS total_jobs
            FROM jobs
            WHERE status = 'active'
        `;
        const result = await db.query(query);
        return parseInt(result.rows[0].total_jobs, 10);
    },

    getTotalEarnings: async () => {
        const query = `
            SELECT SUM(gross_amount) AS total_earnings
            FROM transactions
            WHERE status = 'completed'
        `;
        const result = await db.query(query);
        return parseFloat(result.rows[0].total_earnings) || 0;
    }
};

module.exports = AnalyticsService;