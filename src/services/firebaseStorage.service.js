const firebaseService = require("../config/firebase");
const path = require("path");

class FirebaseStorageService {
  constructor() {
    this.bucket = firebaseService.getBucket();
  }

  /**
   * Upload a single file to Firebase Storage
   * @param {Buffer} fileBuffer - File buffer from multer
   * @param {Object} fileMetadata - File metadata (originalname, mimetype, size)
   * @param {String} folderPath - Folder path in storage (e.g., 'job-products')
   * @returns {Promise<String>} Public URL of uploaded file
   */
  async uploadFile(fileBuffer, fileMetadata, folderPath = "job-products") {
    try {
      // Generate unique filename
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      // Accept either 'originalname' or 'originalName' to be tolerant of callers
      const originalName =
        fileMetadata.originalname || fileMetadata.originalName;
      const ext = path.extname(originalName || "");
      const nameWithoutExt = path.basename(originalName || "", ext);
      const fileName = `${folderPath}/${nameWithoutExt}-${uniqueSuffix}${ext}`;

      // Create file reference
      const fileRef = this.bucket.file(fileName);

      // Upload file
      await fileRef.save(fileBuffer, {
        metadata: {
          contentType: fileMetadata.mimetype,
          metadata: {
            originalName: fileMetadata.originalname,
            uploadedAt: new Date().toISOString(),
          },
        },
      });

      // Make file public
      await fileRef.makePublic();

      // Get public URL - only return URL
      const publicUrl = `https://storage.googleapis.com/${this.bucket.name}/${fileName}`;

      return publicUrl;
    } catch (error) {
      console.error("Error uploading file to Firebase:", error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Upload multiple files to Firebase Storage
   * @param {Array} files - Array of multer files
   * @param {String} folderPath - Folder path in storage
   * @returns {Promise<Array>} Array of public URLs
   */
  async uploadMultipleFiles(files, folderPath = "job-products") {
    try {
      const uploadPromises = files.map((file) =>
        this.uploadFile(
          file.buffer,
          {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
          },
          folderPath
        )
      );

      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error("Error uploading multiple files:", error);
      throw error;
    }
  }

  /**
   * Delete a file from Firebase Storage by URL or path
   * @param {String} fileUrlOrPath - File URL or path in storage
   * @returns {Promise<Boolean>} Success status
   */
  async deleteFile(fileUrlOrPath) {
    try {
      // Extract path from URL if it's a full URL
      let filePath = fileUrlOrPath;
      if (fileUrlOrPath.startsWith("http")) {
        // Extract path from URL: https://storage.googleapis.com/bucket-name/path/to/file.jpg
        const urlParts = fileUrlOrPath.split(`${this.bucket.name}/`);
        if (urlParts.length > 1) {
          filePath = urlParts[1];
        }
      }

      const fileRef = this.bucket.file(filePath);
      const [exists] = await fileRef.exists();

      if (exists) {
        await fileRef.delete();
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error deleting file from Firebase:", error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Delete multiple files from Firebase Storage by URLs or paths
   * @param {Array} fileUrlsOrPaths - Array of file URLs or paths
   * @returns {Promise<Object>} Result with success count
   */
  async deleteMultipleFiles(fileUrlsOrPaths) {
    try {
      const deletePromises = fileUrlsOrPaths.map((fileUrlOrPath) =>
        this.deleteFile(fileUrlOrPath).catch((err) => {
          console.error(`Failed to delete ${fileUrlOrPath}:`, err);
          return false;
        })
      );

      const results = await Promise.all(deletePromises);
      const successCount = results.filter((result) => result === true).length;

      return {
        total: fileUrlsOrPaths.length,
        success: successCount,
        failed: fileUrlsOrPaths.length - successCount,
      };
    } catch (error) {
      console.error("Error deleting multiple files:", error);
      throw error;
    }
  }

  /**
   * Check if a file exists in Firebase Storage
   * @param {String} filePath - File path in storage
   * @returns {Promise<Boolean>} Exists status
   */
  async fileExists(filePath) {
    try {
      const fileRef = this.bucket.file(filePath);
      const [exists] = await fileRef.exists();
      return exists;
    } catch (error) {
      console.error("Error checking file existence:", error);
      return false;
    }
  }

  /**
   * Get file download stream
   * @param {String} filePath - File path in storage
   * @returns {ReadStream} File stream
   */
  getFileStream(filePath) {
    const fileRef = this.bucket.file(filePath);
    return fileRef.createReadStream();
  }

  /**
   * Get signed URL for private file access
   * @param {String} filePath - File path in storage
   * @param {Number} expiresIn - Expiration time in minutes (default: 60)
   * @returns {Promise<String>} Signed URL
   */
  async getSignedUrl(filePath, expiresIn = 60) {
    try {
      const fileRef = this.bucket.file(filePath);
      const [url] = await fileRef.getSignedUrl({
        action: "read",
        expires: Date.now() + expiresIn * 60 * 1000, // Convert to milliseconds
      });
      return url;
    } catch (error) {
      console.error("Error generating signed URL:", error);
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
  }

  /**
   * Get file metadata
   * @param {String} filePath - File path in storage
   * @returns {Promise<Object>} File metadata
   */
  async getFileMetadata(filePath) {
    try {
      const fileRef = this.bucket.file(filePath);
      const [metadata] = await fileRef.getMetadata();
      return metadata;
    } catch (error) {
      console.error("Error getting file metadata:", error);
      throw new Error(`Failed to get file metadata: ${error.message}`);
    }
  }
}

// Export singleton instance
module.exports = new FirebaseStorageService();
