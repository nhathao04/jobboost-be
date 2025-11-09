const multer = require("multer");
const path = require("path");
const firebaseStorageService = require("../services/firebaseStorage.service");

// Configure multer to use memory storage (no local disk storage)
const storage = multer.memoryStorage();

// File filter - allow common document, image, and video formats
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    // Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/zip",
    "application/x-zip-compressed",
    // Images
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    // Text
    "text/plain",
    // Videos
    "video/mp4",
    "video/mpeg",
    "video/quicktime", // .mov
    "video/x-msvideo", // .avi
    "video/x-matroska", // .mkv
    "video/webm",
    "video/x-flv",
    "video/x-ms-wmv",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Allowed: PDF, DOC, DOCX, XLS, XLSX, ZIP, JPG, PNG, GIF, TXT, MP4, MOV, AVI, MKV, WebM, FLV, WMV"
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
    fileSize: 100 * 1024 * 1024, // 100MB per file (supports video files)
    files: 5, // Maximum 5 files per upload (reduced due to larger file sizes)
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
