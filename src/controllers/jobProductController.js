const { JobProduct, Job } = require("../models");
const fs = require("fs");
const path = require("path");

/**
 * Upload job product with files
 */
const uploadProduct = async (req, res, next) => {
  try {
    const { job_id, title, description } = req.body;
    const applicant_id = req.user.id; // From auth middleware

    // Validate required fields
    if (!job_id || !title) {
      // Clean up uploaded files
      if (req.files) {
        req.files.forEach((file) => {
          fs.unlinkSync(file.path);
        });
      }
      return res.status(400).json({
        success: false,
        message: "job_id and title are required",
      });
    }

    // Validate job exists
    const job = await Job.findByPk(job_id);
    if (!job) {
      // Clean up uploaded files
      if (req.files) {
        req.files.forEach((file) => {
          fs.unlinkSync(file.path);
        });
      }
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Prepare files array
    const files = req.files
      ? req.files.map((file) => ({
          name: file.originalname,
          path: file.path,
          size: file.size,
          mimetype: file.mimetype,
        }))
      : [];

    // Create job product
    const jobProduct = await JobProduct.create({
      job_id,
      applicant_id,
      title,
      description,
      files,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Job product uploaded successfully",
      data: jobProduct,
    });
  } catch (error) {
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach((file) => {
        try {
          fs.unlinkSync(file.path);
        } catch (err) {
          console.error("Error deleting file:", err);
        }
      });
    }
    next(error);
  }
};

/**
 * Get user's own job products
 */
const getMyProducts = async (req, res, next) => {
  try {
    const applicant_id = req.user.id;
    const {
      page = 1,
      limit = 10,
      status,
      job_id,
      sort = "created_at",
      order = "DESC",
    } = req.query;

    // Build where clause
    const where = { applicant_id };
    if (status) where.status = status;
    if (job_id) where.job_id = job_id;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await JobProduct.findAndCountAll({
      where,
      include: [
        {
          model: Job,
          as: "job",
          attributes: ["id", "title", "description", "employer_id"],
        },
      ],
      limit: parseInt(limit),
      offset,
      order: [[sort, order.toUpperCase()]],
    });

    res.json({
      success: true,
      data: {
        products: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all products for a specific job (Employer view)
 */
const getProductsByJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const employer_id = req.user.id;
    const {
      page = 1,
      limit = 10,
      status,
      sort = "created_at",
      order = "DESC",
    } = req.query;

    // Verify job belongs to employer
    const job = await Job.findByPk(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (job.employer_id !== employer_id) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view products for this job",
      });
    }

    // Build where clause
    const where = { job_id: jobId };
    if (status) where.status = status;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await JobProduct.findAndCountAll({
      where,
      include: [
        {
          model: Job,
          as: "job",
          attributes: ["id", "title", "description", "employer_id"],
        },
      ],
      limit: parseInt(limit),
      offset,
      order: [[sort, order.toUpperCase()]],
    });

    res.json({
      success: true,
      data: {
        products: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Review job product (Approve or Reject) - Employer only
 */
const reviewProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, rejection_reason } = req.body;
    const reviewer_id = req.user.id;

    // Validate status
    if (!status || !["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'approved' or 'rejected'",
      });
    }

    // Validate rejection reason if status is rejected
    if (status === "rejected" && !rejection_reason) {
      return res.status(400).json({
        success: false,
        message: "rejection_reason is required when rejecting a product",
      });
    }

    // Find product
    const product = await JobProduct.findByPk(id, {
      include: [
        {
          model: Job,
          as: "job",
        },
      ],
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Job product not found",
      });
    }

    // Verify job belongs to employer
    if (product.job.employer_id !== reviewer_id) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to review this product",
      });
    }

    // Update product
    await product.update({
      status,
      rejection_reason: status === "rejected" ? rejection_reason : null,
      reviewed_at: new Date(),
      reviewed_by: reviewer_id,
    });

    res.json({
      success: true,
      message: `Job product ${status} successfully`,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Download job product file
 */
const downloadProductFile = async (req, res, next) => {
  try {
    const { id, fileIndex } = req.params;
    const user_id = req.user.id;

    const product = await JobProduct.findByPk(id, {
      include: [
        {
          model: Job,
          as: "job",
        },
      ],
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Job product not found",
      });
    }

    // Check permission: must be product owner or job employer
    if (
      product.applicant_id !== user_id &&
      product.job.employer_id !== user_id
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to download this file",
      });
    }

    // Get file from array
    const index = parseInt(fileIndex);
    if (index < 0 || index >= product.files.length) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    const file = product.files[index];
    const filePath = path.resolve(file.path);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "File not found on server",
      });
    }

    // Send file
    res.download(filePath, file.name);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete job product (only if status is pending)
 */
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const applicant_id = req.user.id;

    const product = await JobProduct.findByPk(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Job product not found",
      });
    }

    // Check ownership
    if (product.applicant_id !== applicant_id) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete this product",
      });
    }

    // Only allow deletion if status is pending
    if (product.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete product that has been reviewed",
      });
    }

    // Delete files from filesystem
    if (product.files && product.files.length > 0) {
      product.files.forEach((file) => {
        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        } catch (err) {
          console.error("Error deleting file:", err);
        }
      });
    }

    // Delete product from database
    await product.destroy();

    res.json({
      success: true,
      message: "Job product deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadProduct,
  getMyProducts,
  getProductsByJob,
  reviewProduct,
  downloadProductFile,
  deleteProduct,
};
