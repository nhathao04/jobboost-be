const { CV, sequelize } = require("../models");
const { Op } = require("sequelize");
const firebaseStorageService = require("../services/firebaseStorage.service");
const axios = require("axios");

// Upload a new CV to Firebase Storage
exports.uploadCV = async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware

    // Check if file was uploaded to Firebase (set by uploadToFirebase middleware)
    if (!req.uploadedCV) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded. Please upload a PDF file.",
      });
    }

    const { name, description, isPrimary } = req.body;

    // Validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "CV name is required",
      });
    }

    // Start transaction
    const transaction = await sequelize.transaction();

    try {
      // If this CV is set as primary, unset other primary CVs
      if (isPrimary === "true" || isPrimary === true) {
        await CV.update(
          { is_primary: false },
          {
            where: {
              user_id: userId,
              is_primary: true,
            },
            transaction,
          }
        );
      }

      // Create CV record with Firebase Storage URL
      const cv = await CV.create(
        {
          user_id: userId,
          name: name.trim(),
          description: description?.trim() || null,
          file_name: req.uploadedCV.originalName,
          file_url: req.uploadedCV.url,
          file_size: req.uploadedCV.size,
          mime_type: req.uploadedCV.mimetype,
          is_primary: isPrimary === "true" || isPrimary === true,
          status: "active",
        },
        { transaction }
      );

      await transaction.commit();

      res.status(201).json({
        success: true,
        message: "CV uploaded successfully to Firebase Storage",
        data: {
          id: cv.id,
          name: cv.name,
          description: cv.description,
          file_name: cv.file_name,
          file_url: cv.file_url,
          file_size: cv.file_size,
          is_primary: cv.is_primary,
          uploaded_at: cv.uploaded_at,
          created_at: cv.created_at,
        },
      });
    } catch (error) {
      await transaction.rollback();
      // Delete uploaded file from Firebase on database error
      if (req.uploadedCV?.url) {
        try {
          await firebaseStorageService.deleteFile(req.uploadedCV.url);
        } catch (deleteError) {
          console.error("Error deleting file from Firebase:", deleteError);
        }
      }
      throw error;
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while uploading the CV",
      error: error.message,
    });
  }
};

// Get all CVs for current user with Firebase URLs
exports.getUserCVs = async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware

    const { page = 1, limit = 10, status = "active" } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: cvs } = await CV.findAndCountAll({
      where: {
        user_id: userId,
        status: status,
      },
      order: [
        ["is_primary", "DESC"],
        ["created_at", "DESC"],
      ],
      limit: parseInt(limit),
      offset: offset,
    });

    res.status(200).json({
      success: true,
      message: "CVs retrieved successfully from Firebase Storage",
      data: {
        cvs,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / parseInt(limit)),
          total_items: count,
          items_per_page: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching CVs:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch CVs",
      error: error.message,
    });
  }
};

// Get single CV details with Firebase URL
exports.getCVById = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const cv = await CV.findOne({
      where: {
        id,
        user_id: userId,
        status: { [Op.ne]: "deleted" },
      },
    });

    if (!cv) {
      return res.status(404).json({
        success: false,
        message: "CV not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "CV retrieved successfully from Firebase Storage",
      data: cv,
    });
  } catch (error) {
    console.error("Error fetching CV:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch CV",
      error: error.message,
    });
  }
};

// Update CV details (name, description, primary status)
exports.updateCV = async (req, res) => {
  try {
    const userId = req.userId; // Replace with actual auth middleware value
    const { id } = req.params;
    const { name, description, isPrimary } = req.body;

    const cv = await CV.findOne({
      where: {
        id,
        user_id: userId,
        status: { [Op.ne]: "deleted" },
      },
    });

    if (!cv) {
      return res.status(404).json({
        success: false,
        message: "CV not found",
      });
    }

    // Start transaction
    const transaction = await sequelize.transaction();

    try {
      // If setting this CV as primary, unset other primary CVs
      if (isPrimary === true || isPrimary === "true") {
        await CV.update(
          { is_primary: false },
          {
            where: {
              user_id: userId,
              is_primary: true,
              id: { [Op.ne]: id },
            },
            transaction,
          }
        );
      }

      // Update CV
      await cv.update(
        {
          name: name?.trim() || cv.name,
          description:
            description !== undefined
              ? description?.trim() || null
              : cv.description,
          is_primary:
            isPrimary !== undefined
              ? isPrimary === true || isPrimary === "true"
              : cv.is_primary,
        },
        { transaction }
      );

      await transaction.commit();

      res.status(200).json({
        success: true,
        message: "CV updated successfully",
        data: {
          id: cv.id,
          name: cv.name,
          description: cv.description,
          file_name: cv.file_name,
          file_size: cv.file_size,
          is_primary: cv.is_primary,
          updated_at: cv.updated_at,
        },
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Error updating CV:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update CV",
      error: error.message,
    });
  }
};

// Delete CV (soft delete) and remove from Firebase Storage
exports.deleteCV = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const cv = await CV.findOne({
      where: {
        id,
        user_id: userId,
        status: { [Op.ne]: "deleted" },
      },
    });

    if (!cv) {
      return res.status(404).json({
        success: false,
        message: "CV not found",
      });
    }

    // Soft delete
    await cv.update({
      status: "deleted",
    });

    // Delete file from Firebase Storage
    if (cv.file_url) {
      try {
        await firebaseStorageService.deleteFile(cv.file_url);
      } catch (deleteError) {
        console.error("Error deleting file from Firebase:", deleteError);
        // Continue even if Firebase deletion fails
      }
    }

    res.status(200).json({
      success: true,
      message: "CV deleted successfully from database and Firebase Storage",
    });
  } catch (error) {
    console.error("Error deleting CV:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete CV",
      error: error.message,
    });
  }
};

// Download CV file from Firebase Storage (force download with streaming)
exports.downloadCV = async (req, res) => {
  try {
    const { id } = req.params;

    const cv = await CV.findOne({
      where: {
        id,
        status: "active",
      },
    });

    if (!cv) {
      return res.status(404).json({
        success: false,
        message: "CV not found",
      });
    }

    // Fetch file from Firebase Storage and stream to client
    try {
      // Extract filename from URL
      const urlParts = cv.file_url.split("/");
      const filename = urlParts[urlParts.length - 1].split("?")[0];

      const response = await axios({
        method: "GET",
        url: cv.file_url,
        responseType: "stream",
      });

      // Get content type from Firebase response
      const contentType = response.headers["content-type"] || cv.mime_type;

      // Set headers to force download
      res.setHeader("Content-Type", contentType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${cv.file_name}"`
      );

      // Stream file to client
      response.data.pipe(res);
    } catch (downloadError) {
      console.error("Error downloading CV from Firebase:", downloadError);
      return res.status(500).json({
        success: false,
        message: "Error downloading CV from Firebase Storage",
      });
    }
  } catch (error) {
    console.error("Error downloading CV:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to download CV",
      error: error.message,
    });
  }
};

// Set primary CV
exports.setPrimaryCV = async (req, res) => {
  try {
    const userId = req.userId; // Replace with actual auth middleware value
    const { id } = req.params;

    const cv = await CV.findOne({
      where: {
        id,
        user_id: userId,
        status: "active",
      },
    });

    if (!cv) {
      return res.status(404).json({
        success: false,
        message: "CV not found",
      });
    }

    // Start transaction
    const transaction = await sequelize.transaction();

    try {
      // Unset all primary CVs for this user
      await CV.update(
        { is_primary: false },
        {
          where: {
            user_id: userId,
            is_primary: true,
          },
          transaction,
        }
      );

      // Set this CV as primary
      await cv.update(
        {
          is_primary: true,
        },
        { transaction }
      );

      await transaction.commit();

      res.status(200).json({
        success: true,
        message: "Primary CV set successfully",
        data: {
          id: cv.id,
          name: cv.name,
          is_primary: cv.is_primary,
        },
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Error setting primary CV:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to set primary CV",
      error: error.message,
    });
  }
};
