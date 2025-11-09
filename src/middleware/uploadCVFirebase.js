const multer = require("multer");
const firebaseStorageService = require("../services/firebaseStorage.service");

// Configure multer to use memory storage
const storage = multer.memoryStorage();

// File filter - only allow PDF files
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only PDF files are allowed for CV upload."),
      false
    );
  }
};

// Multer upload configuration
const uploadCV = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size for CV
  },
});

// Middleware to upload single CV file to Firebase Storage
const uploadToFirebase = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    // Prepare file metadata
    const fileMetadata = {
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    };

    // Upload to Firebase Storage in 'cvs' folder
    const fileUrl = await firebaseStorageService.uploadFile(
      req.file.buffer,
      fileMetadata,
      "cvs"
    );

    // Attach uploaded file URL and metadata to request
    req.uploadedCV = {
      url: fileUrl,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    };

    next();
  } catch (error) {
    console.error("Firebase CV upload error:", error);
    return res.status(500).json({
      success: false,
      message: "Error uploading CV to Firebase Storage",
      error: error.message,
    });
  }
};

module.exports = {
  uploadCV,
  uploadToFirebase,
};
