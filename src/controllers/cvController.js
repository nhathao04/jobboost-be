const { CV, sequelize } = require("../models");
const path = require("path");
const fs = require("fs");
const { Op } = require("sequelize");

// Upload a new CV
exports.uploadCV = async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded. Please upload a PDF file.",
      });
    }

    const { name, description, isPrimary } = req.body;

    // Validation
    if (!name || name.trim().length === 0) {
      // Delete uploaded file if validation fails
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: "CV name is required",
      });
    }

    // Check file type
    if (req.file.mimetype !== 'application/pdf') {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: "Only PDF files are allowed",
      });
    }

    // Start transaction
    const transaction = await sequelize.transaction();

    try {
      // If this CV is set as primary, unset other primary CVs
      if (isPrimary === 'true' || isPrimary === true) {
        await CV.update(
          { is_primary: false },
          {
            where: {
              user_id: userId,
              is_primary: true
            },
            transaction
          }
        );
      }

      // Create CV record
      const cv = await CV.create({
        user_id: userId,
        name: name.trim(),
        description: description?.trim() || null,
        file_name: req.file.originalname,
        file_path: req.file.path,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        is_primary: isPrimary === 'true' || isPrimary === true,
        status: 'active'
      }, { transaction });

      await transaction.commit();

      res.status(201).json({
        success: true,
        message: "CV uploaded successfully",
        data: {
          id: cv.id,
          name: cv.name,
          description: cv.description,
          file_name: cv.file_name,
          file_size: cv.file_size,
          is_primary: cv.is_primary,
          uploaded_at: cv.uploaded_at,
          created_at: cv.created_at
        }
      });

    } catch (error) {
      await transaction.rollback();
      // Delete uploaded file on database error
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
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

// Get all CVs for current user
exports.getUserCVs = async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware

    const { page = 1, limit = 10, status = 'active' } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: cvs } = await CV.findAndCountAll({
      where: {
        user_id: userId,
        status: status
      },
      order: [
        ['is_primary', 'DESC'],
        ['created_at', 'DESC']
      ],
      limit: parseInt(limit),
      offset: offset,
      attributes: {
        exclude: ['file_path'] // Don't expose file paths in list
      }
    });

    res.status(200).json({
      success: true,
      message: "CVs retrieved successfully",
      data: {
        cvs,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / parseInt(limit)),
          total_items: count,
          items_per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error("Error fetching CVs:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch CVs",
      error: error.message
    });
  }
};

// Get single CV details
exports.getCVById = async (req, res) => {
  try {
    const userId = req.userId; // Replace with actual auth middleware value
    const { id } = req.params;

    const cv = await CV.findOne({
      where: {
        id,
        user_id: userId,
        status: { [Op.ne]: 'deleted' }
      },
      attributes: {
        exclude: ['file_path'] // Don't expose file paths
      }
    });

    if (!cv) {
      return res.status(404).json({
        success: false,
        message: "CV not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "CV retrieved successfully",
      data: cv
    });

  } catch (error) {
    console.error("Error fetching CV:", error);
       return res.status(500).json({
            success: false,
            message: "Failed to fetch CV",
            error: error.message
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
        status: { [Op.ne]: 'deleted' }
      }
    });

    if (!cv) {
      return res.status(404).json({
        success: false,
        message: "CV not found"
      });
    }

    // Start transaction
    const transaction = await sequelize.transaction();

    try {
      // If setting this CV as primary, unset other primary CVs
      if (isPrimary === true || isPrimary === 'true') {
        await CV.update(
          { is_primary: false },
          {
            where: {
              user_id: userId,
              is_primary: true,
              id: { [Op.ne]: id }
            },
            transaction
          }
        );
      }

      // Update CV
      await cv.update({
        name: name?.trim() || cv.name,
        description: description !== undefined ? (description?.trim() || null) : cv.description,
        is_primary: isPrimary !== undefined ? (isPrimary === true || isPrimary === 'true') : cv.is_primary
      }, { transaction });

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
          updated_at: cv.updated_at
        }
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
            error: error.message
           });
  }
};

// Delete CV (soft delete)
exports.deleteCV = async (req, res) => {
  try {
    const userId = req.userId; // Replace with actual auth middleware value
    const { id } = req.params;

    const cv = await CV.findOne({
      where: {
        id,
        user_id: userId,
        status: { [Op.ne]: 'deleted' }
      }
    });

    if (!cv) {
      return res.status(404).json({
        success: false,
        message: "CV not found"
      });
    }

    // Soft delete
    await cv.update({
      status: 'deleted'
    });

    // Delete physical file
    if (fs.existsSync(cv.file_path)) {
      fs.unlinkSync(cv.file_path);
    }

    res.status(200).json({
      success: true,
      message: "CV deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting CV:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete CV",
      error: error.message
    });
  }
};

// Download CV file
exports.downloadCV = async (req, res) => {
  try {
    const userId = req.userId; // Replace with actual auth middleware value
    const { id } = req.params;

    const cv = await CV.findOne({
      where: {
        id,
        user_id: userId,
        status: 'active'
      }
    });

    // Check if file exists
    if (!fs.existsSync(cv.file_path)) {
      return res.status(404).json({
        success: false,
        message: "CV file not found on server"
      });
    }

    // Set headers for file download
    res.setHeader('Content-Type', cv.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${cv.file_name}"`);
    res.setHeader('Content-Length', cv.file_size);

    // Stream the file
    const fileStream = fs.createReadStream(cv.file_path);
    fileStream.pipe(res);

  } catch (error) {
    console.error("Error downloading CV:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to download CV",
      error: error.message
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
        status: 'active'
      }
    });

    if (!cv) {
      return res.status(404).json({
        success: false,
        message: "CV not found"
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
            is_primary: true
          },
          transaction
        }
      );

      // Set this CV as primary
      await cv.update({
        is_primary: true
      }, { transaction });

      await transaction.commit();

      res.status(200).json({
        success: true,
        message: "Primary CV set successfully",
        data: {
          id: cv.id,
          name: cv.name,
          is_primary: cv.is_primary
        }
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
      error: error.message
    });
  }
};