const { JobProduct, Job } = require("../models");
const fs = require("fs");
const path = require("path");
const firebaseStorageService = require("../services/firebaseStorage.service");
const axios = require("axios");

/**
 * Upload job product with files (Firebase Storage)
 */
const uploadProduct = async (req, res, next) => {
  try {
    const { job_id, title, description } = req.body;
    const applicant_id = req.userId; // From auth middleware

    // Validate required fields
    if (!job_id || !title) {
      return res.status(400).json({
        success: false,
        message: "job_id and title are required",
      });
    }

    // Validate job exists
    const job = await Job.findByPk(job_id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Get uploaded files from Firebase (set by uploadToFirebase middleware)
    const files = req.uploadedFiles || [];
    console.log("uploaded file: ", files);

    // Validate that at least one file was uploaded
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one file is required",
      });
    }

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
      message: "Job product uploaded successfully to Firebase",
      data: jobProduct,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's own job products
 */
const getMyProducts = async (req, res, next) => {
  try {
    const applicant_id = req.userId;
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
          attributes: ["id", "title", "description", "owner_id"],
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
    const employer_id = req.userId;
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

    if (job.owner_id !== employer_id) {
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
          attributes: ["id", "title", "description", "owner_id"],
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
    const reviewer_id = req.userId;

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
    if (product.job.owner_id !== reviewer_id) {
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
 * Download job product file (from Firebase Storage)
 */
const downloadProductFile = async (req, res, next) => {
  try {
    const { id, fileIndex } = req.params;
    const user_id = req.userId;

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
    if (product.applicant_id !== user_id && product.job.owner_id !== user_id) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to download this file",
      });
    }

    // Get file URL from array (now files is array of URLs)
    const index = parseInt(fileIndex);
    if (index < 0 || index >= product.files.length) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    const fileUrl = product.files[index];

    // Option 1: Simple redirect (default behavior)
    // return res.redirect(fileUrl);

    // Option 2: Force download with proper filename
    try {
      // Extract filename from URL
      const urlParts = fileUrl.split("/");
      const filename = urlParts[urlParts.length - 1].split("?")[0]; // Remove query params

      // Fetch file from Firebase Storage
      const response = await axios({
        method: "GET",
        url: fileUrl,
        responseType: "stream",
      });

      // Get content type from Firebase response
      const contentType =
        response.headers["content-type"] || "application/octet-stream";

      // Set headers to force download
      res.setHeader("Content-Type", contentType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );

      // Stream file to client
      response.data.pipe(res);
    } catch (downloadError) {
      console.error("Error downloading file from Firebase:", downloadError);
      return res.status(500).json({
        success: false,
        message: "Error downloading file from storage",
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Delete job product (only if status is pending) - Firebase Storage version
 */
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const applicant_id = req.userId;

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

    // Delete files from Firebase Storage using service
    if (product.files && product.files.length > 0) {
      // product.files is now an array of URLs
      const deleteResult = await firebaseStorageService.deleteMultipleFiles(
        product.files
      );
      console.log(
        `Deleted ${deleteResult.success}/${deleteResult.total} files`
      );
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
