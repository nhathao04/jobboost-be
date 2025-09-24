// src/utils/validators.js

const { body, validationResult } = require('express-validator');

const validateUserRegistration = [
    body('email').isEmail().withMessage('Invalid email format'),
    body('full_name').notEmpty().withMessage('Full name is required'),
    body('google_id').notEmpty().withMessage('Google ID is required'),
];

const validateJobPost = [
    body('title').notEmpty().withMessage('Job title is required'),
    body('description').notEmpty().withMessage('Job description is required'),
    body('category_id').isUUID().withMessage('Invalid category ID'),
    body('job_type').isIn(['project', 'freelance', 'part_time']).withMessage('Invalid job type'),
    body('budget_min').isDecimal().withMessage('Minimum budget must be a decimal number'),
    body('budget_max').optional().isDecimal().withMessage('Maximum budget must be a decimal number'),
    body('deadline').isDate().withMessage('Invalid deadline date'),
];

const validateApplication = [
    body('job_id').isUUID().withMessage('Invalid job ID'),
    body('student_id').isUUID().withMessage('Invalid student ID'),
    body('cover_letter').optional().isString().withMessage('Cover letter must be a string'),
    body('proposed_rate').isDecimal().withMessage('Proposed rate must be a decimal number'),
];

const validateAssignment = [
    body('job_id').isUUID().withMessage('Invalid job ID'),
    body('student_id').isUUID().withMessage('Invalid student ID'),
    body('agreed_rate').isDecimal().withMessage('Agreed rate must be a decimal number'),
    body('start_date').isDate().withMessage('Invalid start date'),
    body('expected_end_date').isDate().withMessage('Invalid expected end date'),
];

const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

module.exports = {
    validateUserRegistration,
    validateJobPost,
    validateApplication,
    validateAssignment,
    validateRequest,
};