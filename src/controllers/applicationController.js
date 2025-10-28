const {
  Application,
  Job,
  FreelancerProfile,
  CV,
  Wallet,
  WalletTransaction,
  PlatformRevenue,
  sequelize,
} = require("../models");
const { Op } = require("sequelize");
const { createClient } = require("@supabase/supabase-js");

// Phần trăm phí nền tảng
const PLATFORM_FEE_PERCENTAGE = 8.0; // 8%

// Initialize Supabase client (if configured)
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// Apply for a job (Freelancer)
exports.applyForJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.userId; // From auth middleware

    // If user haven't any CV, block apply
    const cvCount = await CV.count({
      where: { user_id: userId, status: "active" },
    });
    if (cvCount === 0) {
      return res.status(400).json({
        success: false,
        message:
          "You must upload at least one active CV before applying for jobs",
      });
    }

    const { cover_letter, proposed_rate, proposed_timeline, portfolio_links } =
      req.body;

    // Find the job
    const job = await Job.findOne({
      where: {
        id: jobId,
        status: "active", // Can only apply to active jobs
      },
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found or not available for applications",
      });
    }

    // Check if user is not applying to their own job
    if (job.owner_id === userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot apply to your own job",
      });
    }

    // Check if already applied
    const existingApplication = await Application.findOne({
      where: {
        job_id: jobId,
        applicant_id: userId,
      },
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: "You have already applied for this job",
      });
    }

    // Create application
    const application = await Application.create({
      job_id: jobId,
      applicant_id: userId,
      status: "pending",
    });

    // Increment applications_count on job
    await job.increment("applications_count");

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: application,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred while submitting the application",
      error: error.message,
    });
  }
};

// Get my applications (Freelancer)
exports.getMyApplications = async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware
    const { status, page = 1, limit = 10 } = req.query;

    // Build where clause
    const where = {
      applicant_id: userId,
    };

    // Filter by status if provided
    if (status) where.status = status;

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Get applications
    const { count, rows: applications } = await Application.findAndCountAll({
      where,
      include: [
        {
          model: Job,
          as: "job",
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    res.status(200).json({
      success: true,
      data: applications,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred while getting the applications",
      error: error.message,
    });
  }
};

// Withdraw application (Freelancer)
exports.withdrawApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = req.userId; // From auth middleware

    const application = await Application.findOne({
      where: {
        id: applicationId,
        applicant_id: userId,
      },
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message:
          "Application not found or you do not have permission to withdraw it",
      });
    }

    // Check if application can be withdrawn (only pending applications)
    if (application.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot withdraw application with status '${application.status}'`,
      });
    }

    // Update application status to withdrawn
    await application.update({ status: "WITHDRAWN" });

    res.status(200).json({
      success: true,
      message: "Application withdrawn successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while withdrawing the application",
      error: error.message,
    });
  }
};

// Get applications for a job (Employer)
exports.getApplicationsForJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.userId; // From auth middleware

    // Find the job to check ownership
    const job = await Job.findOne({
      where: { id: jobId },
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Check if user is the job owner
    if (job.owner_id !== userId && !req.user.is_admin) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view applications for this job",
      });
    }

    // Get applications with pagination
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const where = { job_id: jobId };
    if (status) where.status = status;

    // Get applications with user info
    const { count, rows: applications } = await Application.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    // For each application, get user info from Supabase and CV
    const applicationsWithUser = await Promise.all(
      applications.map(async (app) => {
        const appData = app.toJSON();

        // Get primary CV for this applicant
        const primaryCV = await CV.findOne({
          where: {
            user_id: appData.applicant_id,
            status: "active",
          },
          attributes: ["id", "name", "file_name", "file_path"],
        });

        console.log(primaryCV);

        // Get user info from Supabase
        let fullName = null;
        if (supabase) {
          try {
            const { data: userData, error } =
              await supabase.auth.admin.getUserById(appData.applicant_id);

            if (!error && userData?.user) {
              // Try to get full_name from user_metadata or raw_user_meta_data
              fullName =
                userData.user.user_metadata?.full_name ||
                userData.user.user_metadata?.name ||
                userData.user.raw_user_meta_data?.full_name ||
                userData.user.raw_user_meta_data?.name ||
                userData.user.email?.split("@")[0] || // Fallback to email username
                null;
            }
          } catch (supabaseError) {
            console.error("Error fetching user from Supabase:", supabaseError);
            // Continue without user data
          }
        }

        // Add user object with full_name and cv
        return {
          ...appData,
          user: {
            full_name: fullName,
            cv: primaryCV
              ? {
                  id: primaryCV.id,
                  name: primaryCV.name,
                  file_name: primaryCV.file_name,
                }
              : null,
          },
        };
      })
    );

    res.status(200).json({
      success: true,
      data: applicationsWithUser,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while getting the applications",
      error: error.message,
    });
  }
};

// Update application status (Employer)
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, employer_notes } = req.body;
    const userId = req.userId; // From auth middleware

    // Validate status
    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'ACCEPTED' or 'REJECTED'",
      });
    }

    // Find application
    const application = await Application.findByPk(applicationId, {
      include: [{ model: Job, as: "job" }],
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Check if user is the job owner
    if (application.job.owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this application",
      });
    }

    // Update application
    await application.update({
      status,
      employer_notes: employer_notes || application.employer_notes,
    });

    res.status(200).json({
      success: true,
      message: `Application ${status} successfully`,
      data: application,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating the application status",
      error: error.message,
    });
  }
};

// Get application details
exports.getApplicationDetail = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = req.userId; // From auth middleware

    const application = await Application.findByPk(applicationId, {
      include: [{ model: Job, as: "job" }],
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Check if user is authorized (either the applicant or the job owner)
    if (
      application.applicant_id !== userId &&
      application.job.owner_id !== userId &&
      !req.user.is_admin
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this application",
      });
    }

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while getting the application details",
      error: error.message,
    });
  }
};

// Get application by ID
exports.getApplicationById = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await Application.findByPk(applicationId, {
      include: [
        {
          model: Job,
        },
        {
          model: User,
          as: "Student",
          attributes: ["id", "full_name", "email", "avatar_url"],
        },
      ],
    });

    if (!application) {
      return res
        .status(404)
        .json({ success: false, message: "Application not found" });
    }

    res.status(200).json({ success: true, data: application });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while getting the application",
      error: error.message,
    });
  }
};

// Delete application
exports.deleteApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await Application.findByPk(applicationId);
    if (!application) {
      return res
        .status(404)
        .json({ success: false, message: "Application not found" });
    }

    await application.destroy();

    res
      .status(200)
      .json({ success: true, message: "Application deleted successfully" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while deleting the application",
      error: error.message,
    });
  }
};

/**
 * Chốt job thành công và chuyển tiền cho freelancer
 * POST /api/applications/:applicationId/complete
 */
exports.completeJobAndTransferMoney = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { applicationId } = req.params;
    const userId = req.userId; // Employer ID

    // Tìm application
    const application = await Application.findByPk(applicationId, {
      include: [
        {
          model: Job,
          as: "job",
        },
      ],
      transaction,
    });

    if (!application) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Kiểm tra quyền (chỉ employer owner mới được chốt)
    if (application.job.owner_id !== userId) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: "You do not have permission to complete this job",
      });
    }

    // Kiểm tra trạng thái application (phải là accepted)
    if (application.status !== "accepted") {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Cannot complete job. Application status must be 'accepted', current status: '${application.status}'`,
      });
    }

    // Kiểm tra job đã completed chưa
    if (application.job.status === "completed") {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "This job has already been completed",
      });
    }

    // Lấy post_cost từ job (số tiền employer đã trả khi đăng tin)
    const totalJobAmount = parseFloat(application.job.post_cost);

    if (!totalJobAmount || totalJobAmount <= 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Invalid job post cost. Cannot transfer money to freelancer.",
      });
    }

    // Tính phí nền tảng (8%)
    const platformFeeAmount = (totalJobAmount * PLATFORM_FEE_PERCENTAGE) / 100;
    const freelancerReceiveAmount = totalJobAmount - platformFeeAmount;

    console.log(`💰 Job completion payment breakdown:`);
    console.log(`   - Total job amount: ${totalJobAmount} VND`);
    console.log(
      `   - Platform fee (${PLATFORM_FEE_PERCENTAGE}%): ${platformFeeAmount} VND`
    );
    console.log(`   - Freelancer receives: ${freelancerReceiveAmount} VND`);

    const freelancerId = application.applicant_id;

    // Tìm hoặc tạo ví cho freelancer
    let freelancerWallet = await Wallet.findOne({
      where: { user_id: freelancerId },
      transaction,
    });

    if (!freelancerWallet) {
      // Tự động tạo ví cho freelancer nếu chưa có
      freelancerWallet = await Wallet.create(
        {
          user_id: freelancerId,
          balance: 0,
          currency: "VND",
          total_deposited: 0,
          total_spent: 0,
          is_active: true,
        },
        { transaction }
      );
      console.log(`✅ Auto-created wallet for freelancer ${freelancerId}`);
    }

    if (!freelancerWallet.is_active) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: "Freelancer wallet is not active",
      });
    }

    // Cộng tiền vào ví freelancer (sau khi trừ phí 8%)
    const freelancerBalanceBefore = parseFloat(freelancerWallet.balance);
    const freelancerBalanceAfter =
      freelancerBalanceBefore + freelancerReceiveAmount;

    await freelancerWallet.update(
      {
        balance: freelancerBalanceAfter,
        total_deposited:
          parseFloat(freelancerWallet.total_deposited) +
          freelancerReceiveAmount,
      },
      { transaction }
    );

    // Tạo transaction cho freelancer (nhận tiền)
    const walletTransaction = await WalletTransaction.create(
      {
        wallet_id: freelancerWallet.id,
        transaction_type: "JOB_POST",
        amount: freelancerReceiveAmount,
        platform_fee: platformFeeAmount,
        currency: freelancerWallet.currency,
        balance_before: freelancerBalanceBefore,
        balance_after: freelancerBalanceAfter,
        reference_id: application.job.id,
        reference_type: "JOB_COMPLETED",
        description: `Payment received for completing job: ${application.job.title} (Platform fee: ${platformFeeAmount} VND)`,
        status: "completed",
        metadata: {
          job_id: application.job.id,
          application_id: application.id,
          employer_id: userId,
          total_job_amount: totalJobAmount,
          platform_fee_percentage: PLATFORM_FEE_PERCENTAGE,
          platform_fee_amount: platformFeeAmount,
          freelancer_receive_amount: freelancerReceiveAmount,
        },
      },
      { transaction }
    );

    // Lưu platform revenue để tracking lợi nhuận
    await PlatformRevenue.create(
      {
        transaction_id: walletTransaction.id,
        job_id: application.job.id,
        total_amount: totalJobAmount,
        fee_percentage: PLATFORM_FEE_PERCENTAGE,
        fee_amount: platformFeeAmount,
        freelancer_amount: freelancerReceiveAmount,
        freelancer_id: freelancerId,
        employer_id: userId,
        revenue_type: "JOB_COMPLETION",
        description: `Platform fee from job: ${application.job.title}`,
        metadata: {
          job_title: application.job.title,
          application_id: application.id,
          completed_at: new Date(),
        },
      },
      { transaction }
    );

    // Cập nhật trạng thái application thành completed
    await application.update(
      {
        status: "completed",
      },
      { transaction }
    );

    // Cập nhật trạng thái job thành completed
    await application.job.update(
      {
        status: "completed",
      },
      { transaction }
    );

    await transaction.commit();

    res.status(200).json({
      success: true,
      message:
        "Job completed successfully. Money transferred to freelancer (minus 8% platform fee).",
      data: {
        application: {
          id: application.id,
          status: "completed",
        },
        job: {
          id: application.job.id,
          title: application.job.title,
          status: "completed",
        },
        payment: {
          total_job_amount: totalJobAmount,
          platform_fee_percentage: PLATFORM_FEE_PERCENTAGE,
          platform_fee_amount: platformFeeAmount,
          freelancer_receive_amount: freelancerReceiveAmount,
          currency: "VND",
          freelancer_id: freelancerId,
          freelancer_new_balance: freelancerBalanceAfter,
        },
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error completing job and transferring money:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while completing the job",
      error: error.message,
    });
  }
};
