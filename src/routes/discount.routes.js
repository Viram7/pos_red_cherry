const express = require("express");
const router = express.Router();
const { verifyUserToken } = require("../middleware/auth.middleware");
const discountController = require("../controllers/discount.controller");

// Protect all routes
router.use(verifyUserToken);

/**
 * @route   POST /api/discounts
 * @desc    Create discount scheme and add to active warehouse
 */
router.post("/", discountController.createDiscount);

/**
 * @route   GET /api/discounts
 * @desc    Get all discounts in active warehouse
 */
router.get("/", discountController.getDiscountsInActiveWarehouse);

/**
 * @route   PUT /api/discounts/:id
 * @desc    Update discount scheme and ensure it belongs to active warehouse
 */
router.put("/:id", discountController.updateDiscountInActiveWarehouse);

/**
 * @route   DELETE /api/discounts/:id
 * @desc    Remove discount from active warehouse
 */
router.delete("/:id", discountController.deleteDiscountFromActiveWarehouse);


router.patch("/:id/activate", discountController.activateDiscountInActiveWarehouse);

router.patch("/:id/deactivate", discountController.deactivateDiscountInActiveWarehouse);

module.exports = router;
