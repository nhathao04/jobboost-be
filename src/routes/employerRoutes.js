const express = require("express");
const router = express.Router();
const employerController = require("../controllers/employerController");
const { authenticate } = require("../middleware/auth");

/**
 * @swagger
 * components:
 *   schemas:
 *     EmployerProfile:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the employer profile
 *         user_id:
 *           type: string
 *           format: uuid
 *           description: ID of the user who owns this employer profile
 *         company_name:
 *           type: string
 *           description: Name of the company
 *         company_website:
 *           type: string
 *           description: Company website URL
 *         company_logo:
 *           type: string
 *           description: Company logo URL
 *         company_description:
 *           type: string
 *           description: Description of the company
 *         industry:
 *           type: string
 *           description: Industry sector
 *         company_size:
 *           type: string
 *           enum: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"]
 *           description: Size of the company
 *         is_verified:
 *           type: boolean
 *           description: Whether the employer is verified
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: When the profile was created
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: When the profile was last updated
 */

/**
 * @swagger
 * /api/employer/register:
 *   post:
 *     summary: Register as an employer
 *     tags: [Employer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - company_name
 *             properties:
 *               company_name:
 *                 type: string
 *                 description: Company name (min 2 characters)
 *                 example: "TechCorp Inc."
 *               company_website:
 *                 type: string
 *                 description: Company website URL
 *                 example: "https://techcorp.com"
 *               company_logo:
 *                 type: string
 *                 description: Company logo URL
 *                 example: "https://example.com/logo.png"
 *               company_description:
 *                 type: string
 *                 description: Company description (max 2000 characters)
 *                 example: "Leading tech company..."
 *               industry:
 *                 type: string
 *                 description: Industry sector
 *                 example: "Technology"
 *               company_size:
 *                 type: string
 *                 enum: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"]
 *                 description: Company size
 *                 example: "51-200"
 *     responses:
 *       201:
 *         description: Employer profile created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Employer profile created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     user_id:
 *                       type: string
 *                       format: uuid
 *                     company_name:
 *                       type: string
 *                     is_verified:
 *                       type: boolean
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Validation error"
 *                 details:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: User already has an employer profile
 *       500:
 *         description: Internal server error
 */
router.post("/employer/register", authenticate, employerController.registerEmployer);

/**
 * @swagger
 * /api/employer/profile:
 *   get:
 *     summary: Get employer profile for current user
 *     tags: [Employer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Employer profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EmployerProfile'
 *       404:
 *         description: Employer profile not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/employer/profile", authenticate, employerController.getEmployerProfile);

/**
 * @swagger
 * /api/employer/profile:
 *   put:
 *     summary: Update employer profile
 *     tags: [Employer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               company_name:
 *                 type: string
 *                 description: Company name (min 2 characters)
 *               company_website:
 *                 type: string
 *                 description: Company website URL
 *               company_logo:
 *                 type: string
 *                 description: Company logo URL
 *               company_description:
 *                 type: string
 *                 description: Company description (max 2000 characters)
 *               industry:
 *                 type: string
 *                 description: Industry sector
 *               company_size:
 *                 type: string
 *                 enum: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"]
 *                 description: Company size
 *     responses:
 *       200:
 *         description: Employer profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/EmployerProfile'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Employer profile not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put("/employer/profile", authenticate, employerController.updateEmployerProfile);

/**
 * @swagger
 * /api/employers:
 *   get:
 *     summary: Get all verified employers (public)
 *     tags: [Employer]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Verified employers retrieved successfully
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
 *                   type: object
 *                   properties:
 *                     employers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/EmployerProfile'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         current_page:
 *                           type: integer
 *                         total_pages:
 *                           type: integer
 *                         total_items:
 *                           type: integer
 *                         items_per_page:
 *                           type: integer
 *       500:
 *         description: Internal server error
 */
router.get("/employers", employerController.getVerifiedEmployers);

/**
 * @swagger
 * /api/admin/employers/{id}/verify:
 *   patch:
 *     summary: Verify/unverify an employer (Admin only)
 *     tags: [Employer, Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Employer profile ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               is_verified:
 *                 type: boolean
 *                 description: Verification status (defaults to true if not provided)
 *     responses:
 *       200:
 *         description: Employer verification status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     company_name:
 *                       type: string
 *                     is_verified:
 *                       type: boolean
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Employer profile not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.patch("/admin/employers/:id/verify", authenticate, employerController.verifyEmployer);

module.exports = router;
