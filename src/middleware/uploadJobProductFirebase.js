const multer = require("multer");
const path = require("path");
const firebaseStorageService = require("../services/firebaseStorage.service");

// Configure multer to use memory storage (no local disk storage)
const storage = multer.memoryStorage();

// File filter - allow common document and image formats
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/zip",
    "application/x-zip-compressed",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "text/plain",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Allowed: PDF, DOC, DOCX, XLS, XLSX, ZIP, JPG, PNG, GIF, TXT"
      ),
      false
    );
  }
};

// Multer configuration
const uploadJobProduct = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB per file
    files: 10, // Maximum 10 files per upload
  },
});

/**
 * Middleware to upload files to Firebase Storage after multer processes them
 */
const uploadToFirebase = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next();
    }

    // Use the Firebase Storage Service to upload files
    req.uploadedFiles = await firebaseStorageService.uploadMultipleFiles(
      req.files,
      "job-products"
    );

    next();
  } catch (error) {
    console.error("Firebase upload error:", error);
    return res.status(500).json({
      success: false,
      message: "Error uploading files to storage",
      error: error.message,
    });
  }
};

module.exports = { uploadJobProduct, uploadToFirebase };
