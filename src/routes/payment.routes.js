const express = require("express");
const router = express.Router();
const { verifyUserToken } = require("../middleware/auth.middleware");
const paymentController = require("../controllers/payment.controller");

// Protect all routes
router.use(verifyUserToken);

/**
 * @route   POST /api/payment-methods
 * @desc    Create a new payment method and add to active warehouse
 */
router.post("/", paymentController.createPaymentMethod);

/**
 * @route   GET /api/payment-methods
 * @desc    Get all payment methods in active warehouse
 */
router.get("/", paymentController.getPaymentMethodsInActiveWarehouse);

/**
 * @route   PUT /api/payment-methods/:id
 * @desc    Update a payment method and link to active warehouse if not already
 */
router.put("/:id", paymentController.updatePaymentMethodInActiveWarehouse);

/**
 * @route   DELETE /api/payment-methods/:id
 * @desc    Remove a payment method from active warehouse
 */
router.delete("/:id", paymentController.deletePaymentMethodFromActiveWarehouse);

module.exports = router;
