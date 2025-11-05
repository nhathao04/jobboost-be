const express = require("express");
const router = express.Router();
const {
  uploadProduct,
  getMyProducts,
  getProductsByJob,
  reviewProduct,
  downloadProductFile,
  deleteProduct,
} = require("../controllers/jobProductController");
const { authenticate } = require("../middleware/auth");
const {
  uploadJobProduct,
  uploadToFirebase,
} = require("../middleware/uploadJobProductFirebase");

/**
 * @swagger
 * components:
 *   schemas:
 *     JobProduct:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Product ID
 *         job_id:
 *           type: string
 *           format: uuid
 *           description: Associated job ID
 *         applicant_id:
 *           type: string
 *           format: uuid
 *           description: Applicant/freelancer ID
 *         title:
 *           type: string
 *           description: Product title
 *           example: "Website Design Mockup"
 *         description:
 *           type: string
 *           description: Product description
 *           example: "High-fidelity mockup with responsive design"
 *         files:
 *           type: array
 *           description: Array of Firebase Storage public URLs
 *           items:
 *             type: string
 *             format: uri
 *             example: "https://storage.googleapis.com/bucket-name/job-products/mockup-1699123456789-123456789.pdf"
 *         status:
 *           type: string
 *           enum: [pending, rejected, approved]
 *           description: Review status
 *           default: pending
 *         rejection_reason:
 *           type: string
 *           nullable: true
 *           description: Reason for rejection (if status is rejected)
 *         reviewed_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Timestamp when product was reviewed
 *         reviewed_by:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: ID of employer who reviewed
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */

/**
 * @swagger
 * /api/v1/job-products:
 *   post:
 *     summary: Upload job product with files to Firebase Storage
 *     description: |
 *       Upload a job product with multiple files. Files are automatically uploaded to Firebase Storage.
 *       - Maximum 10 files per upload
 *       - Maximum 25MB per file
 *       - Supported formats: PDF, DOC, DOCX, XLS, XLSX, ZIP, JPG, PNG, GIF, TXT
 *       - Files are stored in Firebase Storage and publicly accessible via URL
 *     tags: [Job Products]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - job_id
 *               - title
 *             properties:
 *               job_id:
 *                 type: string
 *                 format: uuid
 *                 description: Job ID this product belongs to
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               title:
 *                 type: string
 *                 description: Product title
 *                 example: "Website Design Mockup"
 *                 minLength: 1
 *                 maxLength: 255
 *               description:
 *                 type: string
 *                 description: Detailed product description (optional)
 *                 example: "Complete website design with mobile responsiveness"
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: |
 *                   Product files to upload (max 10 files, 25MB each).
 *                   Files will be uploaded to Firebase Storage automatically.
 *                   Allowed types: PDF, DOC, DOCX, XLS, XLSX, ZIP, JPG, PNG, GIF, TXT
 *     responses:
 *       201:
 *         description: Product uploaded successfully to Firebase Storage
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Job product uploaded successfully to Firebase"
 *                 data:
 *                   $ref: '#/components/schemas/JobProduct'
 *             example:
 *               success: true
 *               message: "Job product uploaded successfully to Firebase"
 *               data:
 *                 id: "123e4567-e89b-12d3-a456-426614174000"
 *                 job_id: "550e8400-e29b-41d4-a716-446655440000"
 *                 applicant_id: "660e8400-e29b-41d4-a716-446655440001"
 *                 title: "Website Design Mockup"
 *                 description: "Complete website design"
 *                 files:
 *                   - "https://storage.googleapis.com/bucket-name/job-products/mockup-1699123456789-123456789.pdf"
 *                   - "https://storage.googleapis.com/bucket-name/job-products/design-1699123456790-987654321.jpg"
 *                 status: "pending"
 *                 created_at: "2025-11-05T10:30:00.000Z"
 *       400:
 *         description: Bad request - Missing required fields or invalid file type
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "job_id and title are required"
 *       404:
 *         description: Job not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Job not found"
 *       500:
 *         description: Firebase upload error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error uploading files to storage"
 *                 error:
 *                   type: string
 */
router.post(
  "/",
  authenticate,
  uploadJobProduct.array("files", 10),
  uploadToFirebase,
  uploadProduct
);

/**
 * @swagger
 * /api/v1/job-products:
 *   get:
 *     summary: Get user's own job products with Firebase Storage URLs
 *     description: |
 *       Retrieve all job products created by the authenticated user.
 *       Each product includes Firebase Storage URLs for direct file access.
 *     tags: [Job Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, rejected, approved]
 *         description: Filter by product status
 *       - in: query
 *         name: job_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by specific job ID
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: created_at
 *         description: Field to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of user's products with Firebase Storage file URLs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/JobProduct'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           description: Total number of products
 *                           example: 25
 *                         page:
 *                           type: integer
 *                           description: Current page number
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           description: Items per page
 *                           example: 10
 *                         pages:
 *                           type: integer
 *                           description: Total number of pages
 *                           example: 3
 */
router.get("/", authenticate, getMyProducts);

/**
 * @swagger
 * /api/v1/job-products/{id}:
 *   delete:
 *     summary: Delete job product and its files from Firebase Storage (pending only)
 *     description: |
 *       Delete a job product and all associated files from Firebase Storage.
 *       - Only products with status "pending" can be deleted
 *       - Only the product owner can delete
 *       - All files will be permanently deleted from Firebase Storage
 *     tags: [Job Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Job product ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Product and files deleted successfully from Firebase Storage
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Job product deleted successfully"
 *       400:
 *         description: Cannot delete reviewed product
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Cannot delete product that has been reviewed"
 *       403:
 *         description: Not authorized - Only product owner can delete
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "You do not have permission to delete this product"
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Job product not found"
 */
router.delete("/:id", authenticate, deleteProduct);

/**
 * @swagger
 * /api/v1/job-products/{id}/files/{fileIndex}:
 *   get:
 *     summary: Download or access job product file from Firebase Storage
 *     description: |
 *       Access a specific file from a job product by its index.
 *       - Redirects to the Firebase Storage public URL
 *       - Only product owner or job employer can access files
 *     tags: [Job Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Job product ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *       - in: path
 *         name: fileIndex
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Index of file URL in files array (0-based)
 *         example: 0
 *     responses:
 *       302:
 *         description: Redirect to Firebase Storage public URL
 *       403:
 *         description: Not authorized to access this file
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "You do not have permission to download this file"
 *       404:
 *         description: Product or file not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "File not found"
 */
router.get("/:id/files/:fileIndex", authenticate, downloadProductFile);

/**
 * @swagger
 * /api/v1/job-products/by-job/{jobId}:
 *   get:
 *     summary: Get all products for a job with Firebase Storage URLs (Employer only)
 *     description: |
 *       Retrieve all job products submitted for a specific job.
 *       Only the job owner (employer) can access this endpoint.
 *       Each product includes Firebase Storage URLs for direct file access.
 *     tags: [Job Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Job ID to get products for
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, rejected, approved]
 *         description: Filter by product status
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: created_at
 *         description: Field to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of products for the job with Firebase Storage file URLs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/JobProduct'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 15
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 10
 *                         pages:
 *                           type: integer
 *                           example: 2
 *       403:
 *         description: Not authorized - Only job owner can access
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "You do not have permission to view products for this job"
 *       404:
 *         description: Job not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Job not found"
 */
router.get("/by-job/:jobId", authenticate, getProductsByJob);

/**
 * @swagger
 * /api/v1/job-products/{id}/review:
 *   patch:
 *     summary: Review job product (Employer only)
 *     tags: [Job Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *               rejection_reason:
 *                 type: string
 *                 description: Required if status is rejected
 *     responses:
 *       200:
 *         description: Product reviewed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/JobProduct'
 *       400:
 *         description: Invalid status or missing rejection reason
 *       403:
 *         description: Not authorized (not job owner)
 *       404:
 *         description: Product not found
 */
router.patch("/:id/review", authenticate, reviewProduct);

module.exports = router;
