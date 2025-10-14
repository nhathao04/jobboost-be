const { Category } = require("../models");
const { handleError } = require("../utils/helpers");

// Create a new category (Admin)
exports.createCategory = async (req, res) => {
  try {
    // Only admin can create categories
    if (!req.user.is_admin) {
      return res.status(403).json({
        success: false,
        message: "Only administrators can create categories",
      });
    }

    const { name, description, icon } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    // Check for duplicate category name
    const existingCategory = await Category.findOne({
      where: { name },
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "A category with this name already exists",
      });
    }

    // Create category
    const category = await Category.create({
      name,
      description,
      icon,
      is_active: true,
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const { active_only } = req.query;

    // Build where clause
    const where = {};
    if (active_only === "true") {
      where.is_active = true;
    }

    const categories = await Category.findAll({
      where,
      order: [["name", "ASC"]],
    });

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Update a category (Admin)
exports.updateCategory = async (req, res) => {
  try {
    // Only admin can update categories
    if (!req.user.is_admin) {
      return res.status(403).json({
        success: false,
        message: "Only administrators can update categories",
      });
    }

    const { categoryId } = req.params;
    const { name, description, icon, is_active } = req.body;

    const category = await Category.findByPk(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // If name is changed, check for duplicates
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({
        where: { name },
      });

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: "A category with this name already exists",
        });
      }
    }

    // Update category
    await category.update({
      name: name || category.name,
      description:
        description !== undefined ? description : category.description,
      icon: icon !== undefined ? icon : category.icon,
      is_active: is_active !== undefined ? is_active : category.is_active,
    });

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Delete a category (Admin)
exports.deleteCategory = async (req, res) => {
  try {
    // Only admin can delete categories
    if (!req.user.is_admin) {
      return res.status(403).json({
        success: false,
        message: "Only administrators can delete categories",
      });
    }

    const { categoryId } = req.params;

    const category = await Category.findByPk(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Instead of deleting, mark as inactive
    await category.update({ is_active: false });

    res.status(200).json({
      success: true,
      message: "Category has been deactivated",
    });
  } catch (error) {
    handleError(res, error);
  }
};
