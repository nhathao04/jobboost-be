const { EmployerProfile, Wallet, sequelize } = require("../models");
const { handleError } = require("../utils/helpers");
const { createClient } = require("@supabase/supabase-js");
const { env } = require("../config/env");

// Số dư mặc định khi tạo ví
const DEFAULT_WALLET_BALANCE = 0; // 1,000,000 VND

// Initialize Supabase client for admin operations (if configured)
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  console.log("✅ Supabase client initialized for user role management");
} else {
  console.warn(
    "⚠️ Supabase credentials not found. User role updates will be skipped."
  );
}

/**
 * Register employer profile
 * POST /api/employer/register
 */
exports.registerEmployer = async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware

    const {
      company_name,
      company_website,
      company_logo,
      company_description,
      industry,
      company_size,
    } = req.body;

    // Validation
    if (!company_name || company_name.trim().length < 2) {
      return res.status(400).json({
        error: "Validation error",
        details: ["Company name is required and must be at least 2 characters"],
      });
    }

    // Validate company_size if provided
    const validSizes = [
      "1-10",
      "11-50",
      "51-200",
      "201-500",
      "501-1000",
      "1000+",
    ];
    if (company_size && !validSizes.includes(company_size)) {
      return res.status(400).json({
        error: "Validation error",
        details: [`Company size must be one of: ${validSizes.join(", ")}`],
      });
    }

    // Validate URLs if provided
    if (company_website) {
      try {
        new URL(company_website);
      } catch (e) {
        return res.status(400).json({
          error: "Validation error",
          details: ["Company website must be a valid URL"],
        });
      }
    }

    if (company_logo) {
      try {
        new URL(company_logo);
      } catch (e) {
        return res.status(400).json({
          error: "Validation error",
          details: ["Company logo must be a valid URL"],
        });
      }
    }

    // Validate description length
    if (company_description && company_description.length > 2000) {
      return res.status(400).json({
        error: "Validation error",
        details: ["Company description must not exceed 2000 characters"],
      });
    }

    // Check if employer profile already exists
    const existingProfile = await EmployerProfile.findOne({
      where: { user_id: userId },
    });

    if (existingProfile) {
      return res.status(409).json({
        error: "User already has an employer profile",
      });
    }

    // Start transaction
    const transaction = await sequelize.transaction();

    try {
      // Create employer profile
      const employerProfile = await EmployerProfile.create(
        {
          user_id: userId,
          company_name: company_name.trim(),
          company_website: company_website || null,
          company_logo: company_logo || null,
          company_description: company_description?.trim() || null,
          industry: industry?.trim() || null,
          company_size: company_size || null,
          is_verified: false,
        },
        { transaction }
      );

      // Update user metadata in Supabase to set role as 'employer'
      if (supabase) {
        try {
          const { data, error } = await supabase.auth.admin.updateUserById(
            userId,
            {
              user_metadata: {
                role: "employer",
              },
            }
          );

          if (error) {
            console.error("Error updating user metadata in Supabase:", error);
            // Don't fail the transaction, just log the error
            console.warn(
              "⚠️ Could not update user role in Supabase, but profile was created"
            );
          } else {
            console.log("✅ User role updated to employer in Supabase");
          }
        } catch (supabaseError) {
          console.error("Supabase admin API error:", supabaseError);
          // Continue anyway - profile is created
        }
      } else {
        console.warn(
          "⚠️ Skipping Supabase role update - Supabase not configured"
        );
      }

      await transaction.commit();

      res.status(201).json({
        message: "Employer profile created successfully",
        data: {
          id: employerProfile.id,
          user_id: employerProfile.user_id,
          company_name: employerProfile.company_name,
          is_verified: employerProfile.is_verified,
          created_at: employerProfile.createdAt,
        },
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Error registering employer:", error);
    return res.status(500).json({
      success: false,
      message: "Error registering employer profile",
      error: error.message,
    });
  }
};

/**
 * Get employer profile
 * GET /api/employer/profile
 */
exports.getEmployerProfile = async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware

    const employerProfile = await EmployerProfile.findOne({
      where: { user_id: userId },
    });

    if (!employerProfile) {
      return res.status(404).json({
        error: "Employer profile not found",
      });
    }

    res.status(200).json({
      id: employerProfile.id,
      user_id: employerProfile.user_id,
      company_name: employerProfile.company_name,
      company_website: employerProfile.company_website,
      company_logo: employerProfile.company_logo,
      company_description: employerProfile.company_description,
      industry: employerProfile.industry,
      company_size: employerProfile.company_size,
      is_verified: employerProfile.is_verified,
      created_at: employerProfile.createdAt,
      updated_at: employerProfile.updatedAt,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching employer profile",
      error: error.message,
    });
  }
};

/**
 * Update employer profile
 * PUT /api/employer/profile
 */
exports.updateEmployerProfile = async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware

    const {
      company_name,
      company_website,
      company_logo,
      company_description,
      industry,
      company_size,
    } = req.body;

    // Find existing profile
    const employerProfile = await EmployerProfile.findOne({
      where: { user_id: userId },
    });

    if (!employerProfile) {
      return res.status(404).json({
        error: "Employer profile not found",
      });
    }

    // Validation
    if (company_name && company_name.trim().length < 2) {
      return res.status(400).json({
        error: "Validation error",
        details: ["Company name must be at least 2 characters"],
      });
    }

    // Validate company_size if provided
    const validSizes = [
      "1-10",
      "11-50",
      "51-200",
      "201-500",
      "501-1000",
      "1000+",
    ];
    if (company_size && !validSizes.includes(company_size)) {
      return res.status(400).json({
        error: "Validation error",
        details: [`Company size must be one of: ${validSizes.join(", ")}`],
      });
    }

    // Validate URLs if provided
    if (company_website) {
      try {
        new URL(company_website);
      } catch (e) {
        return res.status(400).json({
          error: "Validation error",
          details: ["Company website must be a valid URL"],
        });
      }
    }

    if (company_logo) {
      try {
        new URL(company_logo);
      } catch (e) {
        return res.status(400).json({
          error: "Validation error",
          details: ["Company logo must be a valid URL"],
        });
      }
    }

    // Validate description length
    if (company_description && company_description.length > 2000) {
      return res.status(400).json({
        error: "Validation error",
        details: ["Company description must not exceed 2000 characters"],
      });
    }

    // Update profile
    await employerProfile.update({
      company_name: company_name?.trim() || employerProfile.company_name,
      company_website:
        company_website !== undefined
          ? company_website
          : employerProfile.company_website,
      company_logo:
        company_logo !== undefined
          ? company_logo
          : employerProfile.company_logo,
      company_description:
        company_description !== undefined
          ? company_description?.trim()
          : employerProfile.company_description,
      industry:
        industry !== undefined ? industry?.trim() : employerProfile.industry,
      company_size:
        company_size !== undefined
          ? company_size
          : employerProfile.company_size,
    });

    res.status(200).json({
      message: "Employer profile updated successfully",
      data: {
        id: employerProfile.id,
        user_id: employerProfile.user_id,
        company_name: employerProfile.company_name,
        company_website: employerProfile.company_website,
        company_logo: employerProfile.company_logo,
        company_description: employerProfile.company_description,
        industry: employerProfile.industry,
        company_size: employerProfile.company_size,
        is_verified: employerProfile.is_verified,
        created_at: employerProfile.createdAt,
        updated_at: employerProfile.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating employer profile:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update employer profile",
      error: error.message,
    });
  }
};

/**
 * Get all verified employers (public)
 * GET /api/employers
 */
exports.getVerifiedEmployers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: employers } = await EmployerProfile.findAndCountAll({
      where: { is_verified: true },
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: offset,
      attributes: [
        "id",
        "company_name",
        "company_website",
        "company_logo",
        "company_description",
        "industry",
        "company_size",
        "createdAt",
      ],
    });

    res.status(200).json({
      success: true,
      message: "Verified employers retrieved successfully",
      data: {
        employers,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / parseInt(limit)),
          total_items: count,
          items_per_page: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching verified employers:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch verified employers",
      error: error.message,
    });
  }
};

/**
 * Admin: Verify employer
 * PATCH /api/admin/employers/:id/verify
 */
exports.verifyEmployer = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_verified } = req.body;

    const employerProfile = await EmployerProfile.findByPk(id);

    if (!employerProfile) {
      return res.status(404).json({
        error: "Employer profile not found",
      });
    }

    await employerProfile.update({
      is_verified: is_verified !== undefined ? is_verified : true,
    });

    res.status(200).json({
      message: "Employer verification status updated successfully",
      data: {
        id: employerProfile.id,
        company_name: employerProfile.company_name,
        is_verified: employerProfile.is_verified,
        updated_at: employerProfile.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error verifying employer:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify employer",
      error: error.message,
    });
  }
};
