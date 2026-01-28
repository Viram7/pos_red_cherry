// const express = require("express");
// const router = express.Router();
// const { verifyUserToken } = require("../middleware/auth.middleware");
// const productController = require("../controllers/product.controller");

// // Protect all routes
// router.use(verifyUserToken);

// /**
//  * @route   POST /api/products
//  * @desc    Create a new product and add to active warehouse
//  */
// router.post("/", productController.createProduct);

// /**
//  * @route   GET /api/products
//  * @desc    Get all products in active warehouse
//  */
// router.get("/", productController.getProductsInActiveWarehouse);

// /**
//  * @route   GET /api/products/:id
//  * @desc    Get single product in active warehouse
//  */
// router.get("/:id", productController.getProductById);

// /**
//  * @route   PUT /api/products/:id
//  * @desc    Update product in active warehouse
//  */
// router.put("/:id", productController.updateProductInActiveWarehouse);

// /**
//  * @route   DELETE /api/products/:id
//  * @desc    Delete product from active warehouse
//  */
// router.delete("/:id", productController.deleteProductFromActiveWarehouse);

// module.exports = router;







const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controller");
const { verifyUserToken } = require("../middleware/auth.middleware"); 

// All routes require authentication
router.use(verifyUserToken);

/**
 * @route   POST /api/products
 * @desc    Create a new product in active warehouse
 * @body    payload below
 */
router.post("/", productController.createProduct);

/**
 * @route   GET /api/products
 * @desc    Get all products in active warehouse
 */
router.get("/", productController.getProductsInActiveWarehouse);

/**
 * @route   GET /api/products/:id
 * @desc    Get single product by ID (only if in active warehouse)
 */
router.get("/:id", productController.getProductById);

/**
 * @route   PUT /api/products/:id
 * @desc    Update a product in active warehouse
 * @body    similar payload as create, only fields you want to update
 */
router.put("/:id", productController.updateProductInActiveWarehouse);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a product from active warehouse
 */
router.delete("/:id", productController.deleteProductFromActiveWarehouse);

module.exports = router;
