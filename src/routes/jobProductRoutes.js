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
const uploadJobProduct = require("../middleware/uploadJobProduct");

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
 *         job_id:
 *           type: string
 *           format: uuid
 *         applicant_id:
 *           type: string
 *           format: uuid
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         files:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               path:
 *                 type: string
 *               size:
 *                 type: integer
 *               mimetype:
 *                 type: string
 *         status:
 *           type: string
 *           enum: [pending, rejected, approved]
 *         rejection_reason:
 *           type: string
 *           nullable: true
 *         reviewed_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         reviewed_by:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/job-products:
 *   post:
 *     summary: Upload job product with files
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
 *               title:
 *                 type: string
 *                 description: Product title
 *               description:
 *                 type: string
 *                 description: Product description
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Product files (max 10 files, 25MB each)
 *     responses:
 *       201:
 *         description: Product uploaded successfully
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
 *         description: Missing required fields
 *       404:
 *         description: Job not found
 */
router.post(
  "/",
  authenticate,
  uploadJobProduct.array("files", 10),
  uploadProduct
);

/**
 * @swagger
 * /api/v1/job-products:
 *   get:
 *     summary: Get user's own job products
 *     tags: [Job Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, rejected, approved]
 *       - in: query
 *         name: job_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: created_at
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *     responses:
 *       200:
 *         description: List of user's products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
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
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         pages:
 *                           type: integer
 */
router.get("/", authenticate, getMyProducts);

/**
 * @swagger
 * /api/v1/job-products/{id}:
 *   delete:
 *     summary: Delete job product (pending only)
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
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       400:
 *         description: Cannot delete reviewed product
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Product not found
 */
router.delete("/:id", authenticate, deleteProduct);

/**
 * @swagger
 * /api/v1/job-products/{id}/files/{fileIndex}:
 *   get:
 *     summary: Download job product file
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
 *       - in: path
 *         name: fileIndex
 *         required: true
 *         schema:
 *           type: integer
 *         description: Index of file in files array
 *     responses:
 *       200:
 *         description: File download
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Product or file not found
 */
router.get("/:id/files/:fileIndex", authenticate, downloadProductFile);

/**
 * @swagger
 * /api/v1/job-products/by-job/{jobId}:
 *   get:
 *     summary: Get all products for a job (Employer only)
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
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, rejected, approved]
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: created_at
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *     responses:
 *       200:
 *         description: List of products for the job
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/JobProduct'
 *                     pagination:
 *                       type: object
 *       403:
 *         description: Not authorized (not job owner)
 *       404:
 *         description: Job not found
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
