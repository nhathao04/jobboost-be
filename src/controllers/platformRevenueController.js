const { PlatformRevenue, Job, sequelize } = require("../models");
const { Op } = require("sequelize");

/**
 * Lấy tổng quan platform revenue
 */
exports.getPlatformRevenueOverview = async (req, res) => {
  try {
    const { period = "all" } = req.query;

    // Tính toán khoảng thời gian
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
        dateFilter = {
          created_at: {
            [Op.gte]: new Date(now.setDate(now.getDate() - 7)),
          },
        };
        break;
      case "month":
        dateFilter = {
          created_at: {
            [Op.gte]: new Date(now.setDate(now.getDate() - 30)),
          },
        };
        break;
      case "year":
        dateFilter = {
          created_at: {
            [Op.gte]: new Date(now.setFullYear(now.getFullYear() - 1)),
          },
        };
        break;
      default:
        dateFilter = {};
    }

    // Tổng platform revenue
    const revenueStats = await PlatformRevenue.findOne({
      attributes: [
        [sequelize.fn("COUNT", sequelize.col("id")), "total_transactions"],
        [
          sequelize.fn("SUM", sequelize.col("total_amount")),
          "total_job_amount",
        ],
        [
          sequelize.fn("SUM", sequelize.col("fee_amount")),
          "total_platform_revenue",
        ],
        [
          sequelize.fn("SUM", sequelize.col("freelancer_amount")),
          "total_freelancer_payment",
        ],
        [
          sequelize.fn("AVG", sequelize.col("fee_percentage")),
          "avg_fee_percentage",
        ],
        [sequelize.fn("MIN", sequelize.col("fee_amount")), "min_revenue"],
        [sequelize.fn("MAX", sequelize.col("fee_amount")), "max_revenue"],
      ],
      where: dateFilter,
      raw: true,
    });

    // Revenue theo loại
    const revenueByType = await PlatformRevenue.findAll({
      attributes: [
        "revenue_type",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        [sequelize.fn("SUM", sequelize.col("fee_amount")), "total_revenue"],
      ],
      where: dateFilter,
      group: ["revenue_type"],
      raw: true,
    });

    // Top 10 job mang lại revenue cao nhất
    const topJobs = await PlatformRevenue.findAll({
      attributes: [
        "job_id",
        [sequelize.fn("SUM", sequelize.col("fee_amount")), "revenue"],
      ],
      where: {
        ...dateFilter,
        job_id: { [Op.ne]: null },
      },
      include: [
        {
          model: Job,
          as: "job",
          attributes: ["title", "status"],
        },
      ],
      group: ["job_id", "job.id", "job.title", "job.status"],
      order: [[sequelize.fn("SUM", sequelize.col("fee_amount")), "DESC"]],
      limit: 10,
      subQuery: false,
    });

    res.json({
      success: true,
      data: {
        overview: {
          total_transactions: parseInt(revenueStats.total_transactions) || 0,
          total_job_amount: parseFloat(revenueStats.total_job_amount) || 0,
          total_platform_revenue:
            parseFloat(revenueStats.total_platform_revenue) || 0,
          total_freelancer_payment:
            parseFloat(revenueStats.total_freelancer_payment) || 0,
          avg_fee_percentage: parseFloat(revenueStats.avg_fee_percentage) || 0,
          min_revenue: parseFloat(revenueStats.min_revenue) || 0,
          max_revenue: parseFloat(revenueStats.max_revenue) || 0,
          avg_revenue_per_transaction:
            revenueStats.total_transactions > 0
              ? parseFloat(revenueStats.total_platform_revenue) /
                parseInt(revenueStats.total_transactions)
              : 0,
        },
        by_type: revenueByType.map((item) => ({
          type: item.revenue_type,
          count: parseInt(item.count),
          total_revenue: parseFloat(item.total_revenue),
        })),
        top_jobs: topJobs.map((item) => ({
          job_id: item.job_id,
          job_title: item.job?.title || "N/A",
          job_status: item.job?.status || "N/A",
          revenue: parseFloat(item.dataValues.revenue),
        })),
        period,
      },
    });
  } catch (error) {
    console.error("Error getting platform revenue overview:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get platform revenue overview",
      error: error.message,
    });
  }
};

/**
 * Lấy chi tiết platform revenue với phân trang
 */
exports.getPlatformRevenueDetails = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
      revenueType,
      minAmount,
      maxAmount,
      sortBy = "created_at",
      sortOrder = "DESC",
    } = req.query;

    const offset = (page - 1) * limit;
    const limitNum = Math.min(parseInt(limit), 100);

    // Build where clause
    const where = {};

    if (startDate) {
      where.created_at = { [Op.gte]: new Date(startDate) };
    }
    if (endDate) {
      where.created_at = {
        ...where.created_at,
        [Op.lte]: new Date(endDate),
      };
    }
    if (revenueType) {
      where.revenue_type = revenueType;
    }
    if (minAmount) {
      where.fee_amount = { [Op.gte]: parseFloat(minAmount) };
    }
    if (maxAmount) {
      where.fee_amount = {
        ...where.fee_amount,
        [Op.lte]: parseFloat(maxAmount),
      };
    }

    // Get revenues
    const { rows: revenues, count: total } =
      await PlatformRevenue.findAndCountAll({
        where,
        include: [
          {
            model: Job,
            as: "job",
            attributes: ["id", "title", "status"],
          },
        ],
        order: [[sortBy, sortOrder]],
        limit: limitNum,
        offset,
      });

    // Summary statistics
    const summary = await PlatformRevenue.findOne({
      attributes: [
        [sequelize.fn("SUM", sequelize.col("fee_amount")), "total_revenue"],
        [sequelize.fn("AVG", sequelize.col("fee_amount")), "avg_revenue"],
        [sequelize.fn("MIN", sequelize.col("fee_amount")), "min_revenue"],
        [sequelize.fn("MAX", sequelize.col("fee_amount")), "max_revenue"],
      ],
      where,
      raw: true,
    });

    res.json({
      success: true,
      data: {
        revenues: revenues.map((r) => ({
          id: r.id,
          job_id: r.job_id,
          job_title: r.job?.title || "N/A",
          total_amount: parseFloat(r.total_amount),
          fee_percentage: parseFloat(r.fee_percentage),
          fee_amount: parseFloat(r.fee_amount),
          freelancer_amount: parseFloat(r.freelancer_amount),
          freelancer_id: r.freelancer_id,
          employer_id: r.employer_id,
          revenue_type: r.revenue_type,
          description: r.description,
          created_at: r.created_at,
        })),
        summary: {
          total_revenue: parseFloat(summary.total_revenue) || 0,
          avg_revenue: parseFloat(summary.avg_revenue) || 0,
          min_revenue: parseFloat(summary.min_revenue) || 0,
          max_revenue: parseFloat(summary.max_revenue) || 0,
        },
        pagination: {
          page: parseInt(page),
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error("Error getting platform revenue details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get platform revenue details",
      error: error.message,
    });
  }
};

/**
 * Lấy dữ liệu biểu đồ platform revenue
 */
exports.getPlatformRevenueChart = async (req, res) => {
  try {
    const { period = "month" } = req.query;

    let dateFormat, startDate;
    const now = new Date();

    switch (period) {
      case "day":
        dateFormat = "%Y-%m-%d %H:00";
        startDate = new Date(now.setHours(now.getHours() - 24));
        break;
      case "week":
        dateFormat = "%Y-%m-%d";
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case "month":
        dateFormat = "%Y-%m-%d";
        startDate = new Date(now.setDate(now.getDate() - 30));
        break;
      case "year":
        dateFormat = "%Y-%m";
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        dateFormat = "%Y-%m-%d";
        startDate = new Date(now.setDate(now.getDate() - 30));
    }

    const chartData = await PlatformRevenue.findAll({
      attributes: [
        [
          sequelize.fn("TO_CHAR", sequelize.col("created_at"), dateFormat),
          "time",
        ],
        [sequelize.fn("SUM", sequelize.col("fee_amount")), "revenue"],
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      where: {
        created_at: { [Op.gte]: startDate },
      },
      group: [sequelize.fn("TO_CHAR", sequelize.col("created_at"), dateFormat)],
      order: [
        [
          sequelize.fn("TO_CHAR", sequelize.col("created_at"), dateFormat),
          "ASC",
        ],
      ],
      raw: true,
    });

    res.json({
      success: true,
      data: {
        chartData: chartData.map((item) => ({
          time: item.time,
          revenue: parseFloat(item.revenue),
          count: parseInt(item.count),
        })),
        period,
      },
    });
  } catch (error) {
    console.error("Error getting platform revenue chart:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get platform revenue chart",
      error: error.message,
    });
  }
};

/**
 * Lấy revenue breakdown theo freelancer/employer
 */
exports.getPlatformRevenueBreakdown = async (req, res) => {
  try {
    const {
      type = "freelancer",
      page = 1,
      limit = 20,
      period = "all",
    } = req.query;

    const offset = (page - 1) * limit;
    const limitNum = Math.min(parseInt(limit), 100);

    // Date filter
    let dateFilter = {};
    const now = new Date();
    if (period !== "all") {
      switch (period) {
        case "today":
          dateFilter.created_at = {
            [Op.gte]: new Date(now.setHours(0, 0, 0, 0)),
          };
          break;
        case "week":
          dateFilter.created_at = {
            [Op.gte]: new Date(now.setDate(now.getDate() - 7)),
          };
          break;
        case "month":
          dateFilter.created_at = {
            [Op.gte]: new Date(now.setDate(now.getDate() - 30)),
          };
          break;
      }
    }

    const groupByField =
      type === "freelancer" ? "freelancer_id" : "employer_id";

    const breakdown = await PlatformRevenue.findAll({
      attributes: [
        groupByField,
        [sequelize.fn("COUNT", sequelize.col("id")), "transaction_count"],
        [sequelize.fn("SUM", sequelize.col("fee_amount")), "total_revenue"],
        [
          sequelize.fn("SUM", sequelize.col("total_amount")),
          "total_job_amount",
        ],
        [sequelize.fn("AVG", sequelize.col("fee_amount")), "avg_revenue"],
      ],
      where: dateFilter,
      group: [groupByField],
      order: [[sequelize.fn("SUM", sequelize.col("fee_amount")), "DESC"]],
      limit: limitNum,
      offset,
      raw: true,
    });

    // Count total users
    const totalCount = await PlatformRevenue.findAll({
      attributes: [
        groupByField,
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      where: dateFilter,
      group: [groupByField],
      raw: true,
    });

    res.json({
      success: true,
      data: {
        breakdown: breakdown.map((item) => ({
          user_id: item[groupByField],
          transaction_count: parseInt(item.transaction_count),
          total_revenue: parseFloat(item.total_revenue),
          total_job_amount: parseFloat(item.total_job_amount),
          avg_revenue: parseFloat(item.avg_revenue),
        })),
        pagination: {
          page: parseInt(page),
          limit: limitNum,
          total: totalCount.length,
          totalPages: Math.ceil(totalCount.length / limitNum),
        },
        type,
        period,
      },
    });
  } catch (error) {
    console.error("Error getting platform revenue breakdown:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get platform revenue breakdown",
      error: error.message,
    });
  }
};
