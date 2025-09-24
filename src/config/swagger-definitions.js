/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the user
 *         name:
 *           type: string
 *           description: The user's full name
 *         email:
 *           type: string
 *           format: email
 *           description: The user's email address
 *         role:
 *           type: string
 *           enum: [jobseeker, employer, admin]
 *           description: The user's role in the system
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date when the user was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date when the user was last updated
 *       example:
 *         id: 1
 *         name: John Doe
 *         email: john@example.com
 *         role: jobseeker
 *         createdAt: 2023-01-01T00:00:00.000Z
 *         updatedAt: 2023-01-01T00:00:00.000Z
 *
 *     Job:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - companyId
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the job
 *         title:
 *           type: string
 *           description: Job title
 *         description:
 *           type: string
 *           description: Detailed job description
 *         location:
 *           type: string
 *           description: Job location
 *         salary:
 *           type: number
 *           description: Job salary
 *         requirements:
 *           type: string
 *           description: Job requirements
 *         companyId:
 *           type: integer
 *           description: ID of the company that posted the job
 *         status:
 *           type: string
 *           enum: [open, closed]
 *           description: Current job status
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date when the job was posted
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date when the job was last updated
 *       example:
 *         id: 1
 *         title: Full Stack Developer
 *         description: We are looking for a skilled full stack developer
 *         location: Remote
 *         salary: 80000
 *         requirements: 3+ years of experience with React and Node.js
 *         companyId: 1
 *         status: open
 *         createdAt: 2023-01-01T00:00:00.000Z
 *         updatedAt: 2023-01-01T00:00:00.000Z
 *
 *     Application:
 *       type: object
 *       required:
 *         - userId
 *         - jobId
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the application
 *         userId:
 *           type: integer
 *           description: ID of the user who applied
 *         jobId:
 *           type: integer
 *           description: ID of the job applied for
 *         coverLetter:
 *           type: string
 *           description: Applicant's cover letter
 *         resumeUrl:
 *           type: string
 *           description: URL to the applicant's resume
 *         status:
 *           type: string
 *           enum: [pending, reviewed, interviewed, rejected, hired]
 *           description: Current status of the application
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date when the application was submitted
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date when the application was last updated
 *       example:
 *         id: 1
 *         userId: 1
 *         jobId: 1
 *         coverLetter: I am excited to apply for this position...
 *         resumeUrl: https://example.com/resume/1
 *         status: pending
 *         createdAt: 2023-01-01T00:00:00.000Z
 *         updatedAt: 2023-01-01T00:00:00.000Z
 *
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

module.exports = {};
