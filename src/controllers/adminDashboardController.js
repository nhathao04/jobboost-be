const {
  Job,
  Application,
  Wallet,
  WalletTransaction,
  PlatformReview,
  PlatformRevenue,
  JobReview,
  sequelize,
} = require("../models");
const { Op } = require("sequelize");
const { supabase } = require("../config/supabase");

/**
 * Admin Dashboard - Overview Statistics
 * GET /api/admin/dashboard/overview
 */
exports.getDashboardOverview = async (req, res) => {
  try {
    const { period = "all" } = req.query; // all, today, week, month, year

    // Calculate date range
    let dateFilter = {};
    const now = new Date();

    switch (period) {
      case "today":
        dateFilter = {
          created_at: {
            [Op.gte]: new Date(now.setHours(0, 0, 0, 0)),
          },
        };
        break;
      case "week":
        const weekAgo = new Date(now.setDate(now.getDate() - 7));
        dateFilter = { created_at: { [Op.gte]: weekAgo } };
        break;
      case "month":
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
        dateFilter = { created_at: { [Op.gte]: monthAgo } };
        break;
      case "year":
        const yearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
        dateFilter = { created_at: { [Op.gte]: yearAgo } };
        break;
      default:
        dateFilter = {}; // all time
    }

    // 1. Tổng doanh thu (total revenue from job posts)
    const revenueStats = await WalletTransaction.findAll({
      where: {
        transaction_type: "JOB_POST",
        status: "completed",
        ...dateFilter,
      },
      attributes: [
        [sequelize.fn("SUM", sequelize.col("amount")), "total_revenue"],
        [sequelize.fn("COUNT", sequelize.col("id")), "total_transactions"],
        [sequelize.fn("AVG", sequelize.col("amount")), "average_transaction"],
      ],
      raw: true,
    });

    // 2. Tổng số users (từ Supabase)
    const { data: allUsers, error: usersError } =
      await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error("Error fetching users:", usersError);
    }

    // Phân loại users theo metadata role
    const userStats = {
      total_users: allUsers?.users?.length || 0,
      freelancers: 0,
      employers: 0,
      unverified: 0,
      active_this_period: 0,
    };

    if (allUsers?.users) {
      allUsers.users.forEach((user) => {
        const role = user.user_metadata?.role || user.raw_user_meta_data?.role;
        if (role === "employer") userStats.employers++;
        else userStats.freelancers++;

        if (!user.email_confirmed_at) userStats.unverified++;

        // Active in period (có transaction hoặc job trong period)
        const createdAt = new Date(user.created_at);
        if (period !== "all") {
          const filterDate =
            dateFilter.created_at?.[Op.gte] || new Date("2000-01-01");
          if (createdAt >= filterDate) {
            userStats.active_this_period++;
          }
        }
      });
    }

    // 3. Tổng số giao dịch
    const transactionStats = await WalletTransaction.findAll({
      where: dateFilter,
      attributes: [
        [sequelize.fn("COUNT", sequelize.col("id")), "total_count"],
        [
          sequelize.fn(
            "COUNT",
            sequelize.literal(
              "CASE WHEN transaction_type = 'JOB_POST' THEN 1 END"
            )
          ),
          "job_posts",
        ],
        [
          sequelize.fn(
            "COUNT",
            sequelize.literal(
              "CASE WHEN transaction_type = 'DEPOSIT' THEN 1 END"
            )
          ),
          "deposits",
        ],
        [
          sequelize.fn(
            "COUNT",
            sequelize.literal(
              "CASE WHEN transaction_type = 'REFUND' THEN 1 END"
            )
          ),
          "refunds",
        ],
        [
          sequelize.fn(
            "COUNT",
            sequelize.literal(
              "CASE WHEN transaction_type = 'WITHDRAW' THEN 1 END"
            )
          ),
          "withdrawals",
        ],
      ],
      raw: true,
    });

    // 4. Tổng số đánh giá (Job Reviews)
    const reviewStats = await JobReview.findAll({
      where: dateFilter,
      attributes: [
        [sequelize.fn("COUNT", sequelize.col("id")), "total_reviews"],
        [sequelize.fn("AVG", sequelize.col("rating")), "average_rating"],
        [
          sequelize.fn(
            "COUNT",
            sequelize.literal(
              "CASE WHEN reviewer_role = 'FREELANCER' THEN 1 END"
            )
          ),
          "freelancer_reviews",
        ],
        [
          sequelize.fn(
            "COUNT",
            sequelize.literal("CASE WHEN reviewer_role = 'EMPLOYER' THEN 1 END")
          ),
          "employer_reviews",
        ],
      ],
      raw: true,
    });

    // 5. Jobs statistics
    const jobStats = await Job.findAll({
      where: dateFilter,
      attributes: [
        [sequelize.fn("COUNT", sequelize.col("id")), "total_jobs"],
        [
          sequelize.fn(
            "COUNT",
            sequelize.literal("CASE WHEN status = 'active' THEN 1 END")
          ),
          "active_jobs",
        ],
        [
          sequelize.fn(
            "COUNT",
            sequelize.literal("CASE WHEN status = 'pending' THEN 1 END")
          ),
          "pending_jobs",
        ],
        [
          sequelize.fn(
            "COUNT",
            sequelize.literal("CASE WHEN status = 'completed' THEN 1 END")
          ),
          "completed_jobs",
        ],
        [
          sequelize.fn(
            "COUNT",
            sequelize.literal("CASE WHEN status = 'rejected' THEN 1 END")
          ),
          "rejected_jobs",
        ],
      ],
      raw: true,
    });

    // 6. Applications statistics
    const applicationStats = await Application.findAll({
      where: dateFilter,
      attributes: [
        [sequelize.fn("COUNT", sequelize.col("id")), "total_applications"],
        [
          sequelize.fn(
            "COUNT",
            sequelize.literal("CASE WHEN status = 'accepted' THEN 1 END")
          ),
          "accepted",
        ],
        [
          sequelize.fn(
            "COUNT",
            sequelize.literal("CASE WHEN status = 'pending' THEN 1 END")
          ),
          "pending",
        ],
        [
          sequelize.fn(
            "COUNT",
            sequelize.literal("CASE WHEN status = 'rejected' THEN 1 END")
          ),
          "rejected",
        ],
      ],
      raw: true,
    });

    // 7. Platform Revenue (Lợi nhuận của nền tảng)
    const platformRevenueStats = await PlatformRevenue.findAll({
      where: dateFilter,
      attributes: [
        [
          sequelize.fn("SUM", sequelize.col("fee_amount")),
          "total_platform_revenue",
        ],
        [sequelize.fn("COUNT", sequelize.col("id")), "revenue_transactions"],
        [sequelize.fn("AVG", sequelize.col("fee_amount")), "average_fee"],
        [sequelize.fn("SUM", sequelize.col("total_amount")), "total_job_value"],
        [
          sequelize.fn("SUM", sequelize.col("freelancer_amount")),
          "total_freelancer_paid",
        ],
      ],
      raw: true,
    });

    res.status(200).json({
      success: true,
      data: {
        period,
        revenue: {
          total: parseFloat(revenueStats[0]?.total_revenue || 0).toFixed(2),
          transactions_count: parseInt(
            revenueStats[0]?.total_transactions || 0
          ),
          average_per_transaction: parseFloat(
            revenueStats[0]?.average_transaction || 0
          ).toFixed(2),
        },
        platform_revenue: {
          total_platform_fee: parseFloat(
            platformRevenueStats[0]?.total_platform_revenue || 0
          ).toFixed(2),
          revenue_transactions: parseInt(
            platformRevenueStats[0]?.revenue_transactions || 0
          ),
          average_fee: parseFloat(
            platformRevenueStats[0]?.average_fee || 0
          ).toFixed(2),
          total_job_value: parseFloat(
            platformRevenueStats[0]?.total_job_value || 0
          ).toFixed(2),
          total_freelancer_paid: parseFloat(
            platformRevenueStats[0]?.total_freelancer_paid || 0
          ).toFixed(2),
        },
        users: userStats,
        transactions: {
          total: parseInt(transactionStats[0]?.total_count || 0),
          by_type: {
            job_posts: parseInt(transactionStats[0]?.job_posts || 0),
            deposits: parseInt(transactionStats[0]?.deposits || 0),
            refunds: parseInt(transactionStats[0]?.refunds || 0),
            withdrawals: parseInt(transactionStats[0]?.withdrawals || 0),
          },
        },
        reviews: {
          total: parseInt(reviewStats[0]?.total_reviews || 0),
          average_rating: parseFloat(
            reviewStats[0]?.average_rating || 0
          ).toFixed(1),
          by_role: {
            freelancers: parseInt(reviewStats[0]?.freelancer_reviews || 0),
            employers: parseInt(reviewStats[0]?.employer_reviews || 0),
          },
        },
        jobs: {
          total: parseInt(jobStats[0]?.total_jobs || 0),
          active: parseInt(jobStats[0]?.active_jobs || 0),
          pending: parseInt(jobStats[0]?.pending_jobs || 0),
          completed: parseInt(jobStats[0]?.completed_jobs || 0),
          rejected: parseInt(jobStats[0]?.rejected_jobs || 0),
        },
        applications: {
          total: parseInt(applicationStats[0]?.total_applications || 0),
          accepted: parseInt(applicationStats[0]?.accepted || 0),
          pending: parseInt(applicationStats[0]?.pending || 0),
          rejected: parseInt(applicationStats[0]?.rejected || 0),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard overview:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard statistics",
      error: error.message,
    });
  }
};

/**
 * Admin - Chi tiết doanh thu (Revenue Details)
 * GET /api/admin/dashboard/revenue
 */
exports.getRevenueDetails = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      start_date,
      end_date,
      sort_by = "created_at",
      sort_dir = "DESC",
    } = req.query;

    const where = {
      transaction_type: "JOB_POST",
      status: "completed",
    };

    // Date filter
    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at[Op.gte] = new Date(start_date);
      if (end_date) where.created_at[Op.lte] = new Date(end_date);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get transactions with wallet info
    const { count, rows: transactions } =
      await WalletTransaction.findAndCountAll({
        where,
        include: [
          {
            model: Wallet,
            as: "wallet",
            attributes: ["user_id", "wallet_code"],
          },
        ],
        order: [[sort_by, sort_dir]],
        limit: parseInt(limit),
        offset,
      });

    // Get job details for each transaction
    const transactionsWithDetails = await Promise.all(
      transactions.map(async (transaction) => {
        let jobDetails = null;
        if (transaction.reference_id) {
          jobDetails = await Job.findByPk(transaction.reference_id, {
            attributes: ["id", "title", "owner_id", "status"],
          });
        }

        return {
          id: transaction.id,
          amount: transaction.amount,
          currency: transaction.currency,
          wallet_code: transaction.wallet.wallet_code,
          user_id: transaction.wallet.user_id,
          job: jobDetails
            ? {
                id: jobDetails.id,
                title: jobDetails.title,
                status: jobDetails.status,
              }
            : null,
          description: transaction.description,
          created_at: transaction.created_at,
        };
      })
    );

    // Summary statistics
    const summary = await WalletTransaction.findAll({
      where,
      attributes: [
        [sequelize.fn("SUM", sequelize.col("amount")), "total_amount"],
        [sequelize.fn("COUNT", sequelize.col("id")), "transaction_count"],
        [sequelize.fn("AVG", sequelize.col("amount")), "average_amount"],
        [sequelize.fn("MIN", sequelize.col("amount")), "min_amount"],
        [sequelize.fn("MAX", sequelize.col("amount")), "max_amount"],
      ],
      raw: true,
    });

    // Revenue by day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const revenueByDay = await WalletTransaction.findAll({
      where: {
        transaction_type: "JOB_POST",
        status: "completed",
        created_at: { [Op.gte]: thirtyDaysAgo },
      },
      attributes: [
        [sequelize.fn("DATE", sequelize.col("created_at")), "date"],
        [sequelize.fn("SUM", sequelize.col("amount")), "daily_revenue"],
        [sequelize.fn("COUNT", sequelize.col("id")), "daily_count"],
      ],
      group: [sequelize.fn("DATE", sequelize.col("created_at"))],
      order: [[sequelize.fn("DATE", sequelize.col("created_at")), "ASC"]],
      raw: true,
    });

    // Platform Profit Statistics (8% fee from completed jobs)
    const platformProfitWhere = {};
    if (start_date || end_date) {
      platformProfitWhere.created_at = {};
      if (start_date)
        platformProfitWhere.created_at[Op.gte] = new Date(start_date);
      if (end_date) platformProfitWhere.created_at[Op.lte] = new Date(end_date);
    }

    const platformProfit = await PlatformRevenue.findAll({
      where: platformProfitWhere,
      attributes: [
        [sequelize.fn("SUM", sequelize.col("fee_amount")), "total_profit"],
        [sequelize.fn("COUNT", sequelize.col("id")), "completed_jobs"],
        [
          sequelize.fn("AVG", sequelize.col("fee_amount")),
          "average_profit_per_job",
        ],
        [sequelize.fn("SUM", sequelize.col("total_amount")), "total_job_value"],
        [
          sequelize.fn("SUM", sequelize.col("freelancer_amount")),
          "total_paid_to_freelancers",
        ],
      ],
      raw: true,
    });

    // Platform profit by day (last 30 days)
    const platformProfitByDay = await PlatformRevenue.findAll({
      where: {
        created_at: { [Op.gte]: thirtyDaysAgo },
      },
      attributes: [
        [sequelize.fn("DATE", sequelize.col("created_at")), "date"],
        [sequelize.fn("SUM", sequelize.col("fee_amount")), "daily_profit"],
        [sequelize.fn("COUNT", sequelize.col("id")), "daily_completed_jobs"],
      ],
      group: [sequelize.fn("DATE", sequelize.col("created_at"))],
      order: [[sequelize.fn("DATE", sequelize.col("created_at")), "ASC"]],
      raw: true,
    });

    res.status(200).json({
      success: true,
      data: {
        transactions: transactionsWithDetails,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / parseInt(limit)),
        },
        summary: {
          // Doanh thu từ job posts (employer trả phí đăng job)
          total_revenue: parseFloat(summary[0]?.total_amount || 0).toFixed(2),
          transaction_count: parseInt(summary[0]?.transaction_count || 0),
          average_amount: parseFloat(summary[0]?.average_amount || 0).toFixed(
            2
          ),
          min_amount: parseFloat(summary[0]?.min_amount || 0).toFixed(2),
          max_amount: parseFloat(summary[0]?.max_amount || 0).toFixed(2),

          // Lợi nhuận từ phí 8% khi job hoàn thành
          platform_profit: {
            total_profit: parseFloat(
              platformProfit[0]?.total_profit || 0
            ).toFixed(2),
            completed_jobs: parseInt(platformProfit[0]?.completed_jobs || 0),
            average_profit_per_job: parseFloat(
              platformProfit[0]?.average_profit_per_job || 0
            ).toFixed(2),
            total_job_value: parseFloat(
              platformProfit[0]?.total_job_value || 0
            ).toFixed(2),
            total_paid_to_freelancers: parseFloat(
              platformProfit[0]?.total_paid_to_freelancers || 0
            ).toFixed(2),
            profit_percentage: "8%",
          },
        },
        revenue_by_day: revenueByDay,
        platform_profit_by_day: platformProfitByDay,
      },
    });
  } catch (error) {
    console.error("Error fetching revenue details:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching revenue details",
      error: error.message,
    });
  }
};

/**
 * Admin - Chi tiết users
 * GET /api/admin/dashboard/users
 */
exports.getUsersDetails = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      role,
      verified,
      search,
      sort_by = "created_at",
      sort_dir = "desc",
    } = req.query;

    // Get all users from Supabase
    const { data: allUsers, error: usersError } =
      await supabase.auth.admin.listUsers({
        page: parseInt(page),
        perPage: parseInt(limit),
      });

    if (usersError) {
      throw new Error(usersError.message);
    }

    let filteredUsers = allUsers.users || [];

    // Filter by role
    if (role) {
      filteredUsers = filteredUsers.filter((user) => {
        const userRole =
          user.user_metadata?.role || user.raw_user_meta_data?.role;
        return userRole === role;
      });
    }

    // Filter by verified status
    if (verified !== undefined) {
      const isVerified = verified === "true";
      filteredUsers = filteredUsers.filter((user) =>
        isVerified ? user.email_confirmed_at : !user.email_confirmed_at
      );
    }

    // Search by email or name
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = filteredUsers.filter(
        (user) =>
          user.email?.toLowerCase().includes(searchLower) ||
          user.user_metadata?.full_name?.toLowerCase().includes(searchLower) ||
          user.raw_user_meta_data?.full_name
            ?.toLowerCase()
            .includes(searchLower)
      );
    }

    // Get additional stats for each user
    const usersWithStats = await Promise.all(
      filteredUsers.map(async (user) => {
        const userRole =
          user.user_metadata?.role || user.raw_user_meta_data?.role;

        // Get wallet info
        const wallet = await Wallet.findOne({
          where: { user_id: user.id },
          attributes: ["balance", "total_spent", "total_deposited"],
        });

        let jobsCount = 0;
        let applicationsCount = 0;
        let reviewsCount = 0;

        if (userRole === "employer") {
          // Count jobs created
          jobsCount = await Job.count({ where: { owner_id: user.id } });
        } else if (userRole === "freelancer") {
          // Count applications
          applicationsCount = await Application.count({
            where: { applicant_id: user.id },
          });
        }

        // Count reviews
        reviewsCount = await PlatformReview.count({
          where: { user_id: user.id },
        });

        return {
          id: user.id,
          email: user.email,
          full_name:
            user.user_metadata?.full_name || user.raw_user_meta_data?.full_name,
          role: userRole,
          email_confirmed: !!user.email_confirmed_at,
          created_at: user.created_at,
          last_sign_in: user.last_sign_in_at,
          wallet: wallet
            ? {
                balance: parseFloat(wallet.balance),
                total_spent: parseFloat(wallet.total_spent),
                total_deposited: parseFloat(wallet.total_deposited),
              }
            : null,
          activity: {
            jobs_created: jobsCount,
            applications_count: applicationsCount,
            reviews_count: reviewsCount,
          },
        };
      })
    );

    // Sort results
    usersWithStats.sort((a, b) => {
      const aVal = a[sort_by] || "";
      const bVal = b[sort_by] || "";
      if (sort_dir === "asc") {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

    res.status(200).json({
      success: true,
      data: {
        users: usersWithStats,
        pagination: {
          total: filteredUsers.length,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(filteredUsers.length / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching users details:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching users details",
      error: error.message,
    });
  }
};

/**
 * Admin - Chi tiết giao dịch (Transactions Details)
 * GET /api/admin/dashboard/transactions
 */
exports.getTransactionsDetails = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      transaction_type,
      status,
      start_date,
      end_date,
      min_amount,
      max_amount,
      sort_by = "created_at",
      sort_dir = "DESC",
    } = req.query;

    const where = {};

    // Filters
    if (transaction_type) where.transaction_type = transaction_type;
    if (status) where.status = status;

    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at[Op.gte] = new Date(start_date);
      if (end_date) where.created_at[Op.lte] = new Date(end_date);
    }

    if (min_amount || max_amount) {
      where.amount = {};
      if (min_amount) where.amount[Op.gte] = parseFloat(min_amount);
      if (max_amount) where.amount[Op.lte] = parseFloat(max_amount);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: transactions } =
      await WalletTransaction.findAndCountAll({
        where,
        include: [
          {
            model: Wallet,
            as: "wallet",
            attributes: ["user_id", "wallet_code"],
          },
        ],
        order: [[sort_by, sort_dir]],
        limit: parseInt(limit),
        offset,
      });

    // Get user info from Supabase for each transaction
    const transactionsWithUserInfo = await Promise.all(
      transactions.map(async (transaction) => {
        const { data: user } = await supabase.auth.admin.getUserById(
          transaction.wallet.user_id
        );

        return {
          ...transaction.toJSON(),
          user: user
            ? {
                id: user.user.id,
                email: user.user.email,
                full_name:
                  user.user.user_metadata?.full_name ||
                  user.user.raw_user_meta_data?.full_name,
              }
            : null,
        };
      })
    );

    // Summary by type
    const summaryByType = await WalletTransaction.findAll({
      where,
      attributes: [
        "transaction_type",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        [sequelize.fn("SUM", sequelize.col("amount")), "total_amount"],
      ],
      group: ["transaction_type"],
      raw: true,
    });

    res.status(200).json({
      success: true,
      data: {
        transactions: transactionsWithUserInfo,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / parseInt(limit)),
        },
        summary_by_type: summaryByType,
      },
    });
  } catch (error) {
    console.error("Error fetching transactions details:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching transactions details",
      error: error.message,
    });
  }
};

/**
 * Admin - Chi tiết đánh giá (Job Reviews Details)
 * GET /api/admin/dashboard/reviews
 */
exports.getReviewsDetails = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      reviewer_role,
      rating,
      job_id,
      start_date,
      end_date,
      sort_by = "created_at",
      sort_dir = "DESC",
    } = req.query;

    const where = {};

    // Filters
    if (reviewer_role) where.reviewer_role = reviewer_role.toUpperCase();
    if (rating) where.rating = parseInt(rating);
    if (job_id) where.job_id = job_id;

    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at[Op.gte] = new Date(start_date);
      if (end_date) where.created_at[Op.lte] = new Date(end_date);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: reviews } = await JobReview.findAndCountAll({
      where,
      include: [
        {
          model: Job,
          as: "job",
          attributes: ["id", "title", "status"],
        },
      ],
      order: [[sort_by, sort_dir]],
      limit: parseInt(limit),
      offset,
    });

    // Get user info for each review
    const reviewsWithUserInfo = await Promise.all(
      reviews.map(async (review) => {
        const reviewObj = review.toJSON();

        if (supabase) {
          // Get reviewer info
          const { data: reviewer } = await supabase.auth.admin.getUserById(
            review.reviewer_id
          );
          reviewObj.reviewer = reviewer
            ? {
                id: reviewer.id,
                email: reviewer.email,
                full_name: reviewer.user_metadata?.full_name || "Unknown",
              }
            : null;

          // Get employer info
          const { data: employer } = await supabase.auth.admin.getUserById(
            review.employer_id
          );
          reviewObj.employer = employer
            ? {
                id: employer.id,
                email: employer.email,
                full_name: employer.user_metadata?.full_name || "Unknown",
              }
            : null;

          // Get freelancer info
          const { data: freelancer } = await supabase.auth.admin.getUserById(
            review.freelancer_id
          );
          reviewObj.freelancer = freelancer
            ? {
                id: freelancer.id,
                email: freelancer.email,
                full_name: freelancer.user_metadata?.full_name || "Unknown",
              }
            : null;
        }

        return reviewObj;
      })
    );

    // Statistics
    const stats = await JobReview.findAll({
      where,
      attributes: [
        [sequelize.fn("AVG", sequelize.col("rating")), "average_rating"],
        [
          sequelize.fn(
            "COUNT",
            sequelize.literal("CASE WHEN reviewer_role = 'EMPLOYER' THEN 1 END")
          ),
          "employer_review_count",
        ],
        [
          sequelize.fn(
            "COUNT",
            sequelize.literal(
              "CASE WHEN reviewer_role = 'FREELANCER' THEN 1 END"
            )
          ),
          "freelancer_review_count",
        ],
      ],
      raw: true,
    });

    // Rating distribution
    const ratingDist = await JobReview.findAll({
      where,
      attributes: [
        "rating",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["rating"],
      order: [["rating", "DESC"]],
      raw: true,
    });

    res.status(200).json({
      success: true,
      data: {
        reviews: reviewsWithUserInfo,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / parseInt(limit)),
        },
        statistics: {
          average_rating: parseFloat(stats[0]?.average_rating || 0).toFixed(1),
          employer_review_count: parseInt(stats[0]?.employer_review_count || 0),
          freelancer_review_count: parseInt(
            stats[0]?.freelancer_review_count || 0
          ),
          rating_distribution: ratingDist,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching reviews details:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching reviews details",
      error: error.message,
    });
  }
};

/**
 * Admin - Revenue Chart Data (for graphs)
 * GET /api/admin/dashboard/revenue/chart
 */
exports.getRevenueChart = async (req, res) => {
  try {
    const { period = "month" } = req.query; // day, week, month, year

    let groupBy, dateFormat;
    let startDate = new Date();

    switch (period) {
      case "day":
        // Last 24 hours, grouped by hour
        startDate.setHours(startDate.getHours() - 24);
        groupBy = sequelize.fn(
          "DATE_TRUNC",
          "hour",
          sequelize.col("created_at")
        );
        dateFormat = "hour";
        break;
      case "week":
        // Last 7 days, grouped by day
        startDate.setDate(startDate.getDate() - 7);
        groupBy = sequelize.fn("DATE", sequelize.col("created_at"));
        dateFormat = "day";
        break;
      case "year":
        // Last 12 months, grouped by month
        startDate.setMonth(startDate.getMonth() - 12);
        groupBy = sequelize.fn(
          "DATE_TRUNC",
          "month",
          sequelize.col("created_at")
        );
        dateFormat = "month";
        break;
      default:
        // Last 30 days, grouped by day
        startDate.setDate(startDate.getDate() - 30);
        groupBy = sequelize.fn("DATE", sequelize.col("created_at"));
        dateFormat = "day";
    }

    const chartData = await WalletTransaction.findAll({
      where: {
        transaction_type: "JOB_POST",
        status: "completed",
        created_at: { [Op.gte]: startDate },
      },
      attributes: [
        [groupBy, "period"],
        [sequelize.fn("SUM", sequelize.col("amount")), "revenue"],
        [sequelize.fn("COUNT", sequelize.col("id")), "transaction_count"],
      ],
      group: [groupBy],
      order: [[groupBy, "ASC"]],
      raw: true,
    });

    res.status(200).json({
      success: true,
      data: {
        period,
        chart_data: chartData.map((item) => ({
          period: item.period,
          revenue: parseFloat(item.revenue).toFixed(2),
          transaction_count: parseInt(item.transaction_count),
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching revenue chart:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching revenue chart data",
      error: error.message,
    });
  }
};
