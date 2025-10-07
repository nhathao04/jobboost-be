const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const { authenticate, isAdmin } = require("../middleware/auth");

// Public routes
router.get("/categories", categoryController.getAllCategories);

// Admin routes
router.post(
  "/categories",
  authenticate,
  isAdmin,
  categoryController.createCategory
);
router.put(
  "/categories/:categoryId",
  authenticate,
  isAdmin,
  categoryController.updateCategory
);
router.delete(
  "/categories/:categoryId",
  authenticate,
  isAdmin,
  categoryController.deleteCategory
);

module.exports = router;
