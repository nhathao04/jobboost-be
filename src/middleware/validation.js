const { body, validationResult } = require("express-validator");

const validateUserRegistration = [
  body("email").isEmail().withMessage("Please enter a valid email address."),
  body("full_name").notEmpty().withMessage("Full name is required."),
  body("google_id").notEmpty().withMessage("Google ID is required."),
];

const validateJobCreation = [
  body("title").notEmpty().withMessage("Job title is required."),
  body("description").notEmpty().withMessage("Job description is required."),
  body("category_id").isUUID().withMessage("Category ID must be a valid UUID."),
  body("budget_min")
    .isDecimal()
    .withMessage("Minimum budget must be a decimal number."),
  body("budget_max")
    .isDecimal()
    .withMessage("Maximum budget must be a decimal number."),
];

const validateApplicationSubmission = [
  body("job_id").isUUID().withMessage("Job ID must be a valid UUID."),
  body("student_id").isUUID().withMessage("Student ID must be a valid UUID."),
  body("cover_letter")
    .optional()
    .isString()
    .withMessage("Cover letter must be a string."),
  body("proposed_rate")
    .optional()
    .isDecimal()
    .withMessage("Proposed rate must be a decimal number."),
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
  validateRegistration: validateUserRegistration, // alias for auth routes
  validateLogin: [
    body("email").isEmail().withMessage("Please enter a valid email address."),
  ],
  validateJobCreation,
  validateApplicationSubmission,
  validateRequest,
};
