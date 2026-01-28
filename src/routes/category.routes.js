const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/category.controller");
const { verifyUserToken } = require("../middleware/auth.middleware"); // JWT auth

// All routes require authentication
router.use(verifyUserToken);

/**
 * @route   POST /api/categories
 * @desc    Create a new category and add to active warehouse
 */
router.post("/", categoryController.createCategory);

/**
 * @route   GET /api/categories
 * @desc    Get all categories in active warehouse
 */
router.get("/", categoryController.getCategoriesInActiveWarehouse);

/**
 * @route   PUT /api/categories/:id
 * @desc    Update a category and link to active warehouse if not already
 */
router.put("/:id", categoryController.updateCategoryInActiveWarehouse);

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete a category from active warehouse only
 */
router.delete("/:id", categoryController.deleteCategoryFromActiveWarehouse);

module.exports = router;
