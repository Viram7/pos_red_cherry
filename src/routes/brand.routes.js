const express = require("express");
const router = express.Router();
const brandController = require("../controllers/brand.controller");
const { verifyUserToken } = require("../middleware/auth.middleware"); // your JWT middleware

// All routes require authentication
router.use(verifyUserToken);

/**
 * @route   POST /api/brands
 * @desc    Create a new brand and add to active warehouse
 */
router.post("/", brandController.createBrand);

/**
 * @route   GET /api/brands
 * @desc    Get all brands in the active warehouse
 */
router.get("/", brandController.getBrandsInActiveWarehouse);

/**
 * @route   PUT /api/brands/:id
 * @desc    Update a brand and link to active warehouse if not already
 */
router.put("/:id", brandController.updateBrandInActiveWarehouse);

/**
 * @route   DELETE /api/brands/:id
 * @desc    Delete a brand from active warehouse only
 */
router.delete("/:id", brandController.deleteBrandFromActiveWarehouse);

module.exports = router;
