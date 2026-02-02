const Product = require("../models/product.model");
const Warehouse = require("../models/warehouse.model");

/**
 * Helper: Calculate total stock & total value
 */
const calculateTotals = (variants = []) => {
  return variants.reduce(
    (acc, v) => {
      acc.totalStock += v.quantity;
      acc.totalValue += v.quantity * v.price;
      return acc;
    },
    { totalStock: 0, totalValue: 0 }
  );
};

/**
 * Helper: Validate product & variant fields
 */
const validateFields = (productFields = [], variants = []) => {
  // product-level fields
  productFields.forEach((f) => {
    if (!f.name || !f.value) {
      throw new Error("Each product field must contain name and value");
    }
  });

  // variant-level validation
  if (!variants.length) {
    throw new Error("At least one variant is required");
  }

  const variantSkuSet = new Set();

  variants.forEach((v) => {
    if (!v.variantSku || v.price == null || v.quantity == null) {
      throw new Error("Each variant must have variantSku, price, and quantity");
    }

    if (!Array.isArray(v.fields) || !v.fields.length) {
      throw new Error(`Variant ${v.variantSku} must contain its own fields`);
    }

    v.fields.forEach((f) => {
      if (!f.name || !f.value) {
        throw new Error(`Invalid field in variant ${v.variantSku}`);
      }
    });

    if (variantSkuSet.has(v.variantSku)) {
      throw new Error(`Duplicate variant SKU: ${v.variantSku}`);
    }

    variantSkuSet.add(v.variantSku);
  });
};

const checkDuplicateBarcodes = async (newVariants) => {
  // Flatten all barcodes from new product variants
  const newBarcodes = newVariants.flatMap(v => v.barcodefield || []);
  if (newBarcodes.length === 0) return [];

  // Find products where any variant has a barcode in newBarcodes
  const existingProducts = await Product.find(
    { "variants.barcodefield": { $elemMatch: { $in: newBarcodes } } },
    { name: 1, variants: 1 }
  );

  const duplicates = [];

  existingProducts.forEach(product => {
    product.variants.forEach(variant => {
      if (!variant.barcodefield || variant.barcodefield.length === 0) return;
      const intersect = variant.barcodefield.filter(b => newBarcodes.includes(b));
      if (intersect.length > 0) {
        duplicates.push({
          productId: product._id,
          productName: product.name,
          variantSku: variant.variantSku,
          barcodes: intersect,
        });
      }
    });
  });

  return duplicates;
};



/**
 * CREATE Product (added to active warehouse)
 */
exports.createProduct = async (req, res) => {
  try {
    const {
      sku,
      name,
      category,
      brand,
      barcodefieldName,
      productFields = [],
      description,
      variants = [],
    } = req.body;

    if (!sku || !name || !category || !brand) {
      return res.status(400).json({
        success: false,
        message: "SKU, name, category, and brand are required",
      });
    }

    // prevent duplicate product SKU
    const existing = await Product.findOne({ sku });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Product SKU already exists",
      });
    }


    const duplicates = await checkDuplicateBarcodes(variants);
if (duplicates.length > 0) {
  return res.status(400).json({
    success: false,
    message: "Some barcodes already exist in other products",
    duplicates,
  });
}


    // validate payload
    validateFields(productFields, variants);



    // calculate totals
    const { totalStock, totalValue } = calculateTotals(variants);

    // create product
    const product = await Product.create({
      sku,
      name,
      category,
      brand,
      barcodefieldName,
      productFields,
      description,
      variants,
      totalStock,
      totalValue,
    });

    // attach product to active warehouse
    const activeWarehouse = await Warehouse.findOne({
      createdBy: req.user._id,
      active: true,
    });

    if (!activeWarehouse) {
      return res.status(400).json({
        success: false,
        message: "No active warehouse found",
      });
    }

    activeWarehouse.products.push(product._id);
    await activeWarehouse.save();

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET All Products in Active Warehouse
 */
exports.getProductsInActiveWarehouse = async (req, res) => {
  try {
    const warehouse = await Warehouse.findOne({
      createdBy: req.user._id,
      active: true,
    }).populate({
      path: "products",
      populate: [
        { path: "category" },
        { path: "brand" },
      ],
    });

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: "No active warehouse found",
      });
    }

    res.status(200).json({
      success: true,
      data: warehouse.products,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET Single Product (only if in active warehouse)
 */
exports.getProductById = async (req, res) => {
  try {
    const productId = req.params.id;

    const warehouse = await Warehouse.findOne({
      createdBy: req.user._id,
      active: true,
    });

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: "No active warehouse found",
      });
    }

    const exists = warehouse.products.some(
      (id) => id.toString() === productId
    );

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: "Product not found in active warehouse",
      });
    }

    const product = await Product.findById(productId)
      .populate("category")
      .populate("brand");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * UPDATE Product (recalculate totals if variants change)
 */

exports.updateProductInActiveWarehouse = async (req, res) => {
  try {
    const productId = req.params.id;
    const updates = { ...req.body }; // clone to modify safely

    const warehouse = await Warehouse.findOne({
      createdBy: req.user._id,
      active: true,
    });

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: "No active warehouse found",
      });
    }

    const exists = warehouse.products.some(
      (id) => id.toString() === productId
    );

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: "Product not found in active warehouse",
      });
    }

    // Validate updated fields
    if (updates.productFields || updates.variants) {
      validateFields(
        updates.productFields || [],
        updates.variants || []
      );
    }

    // Recalculate totals if variants updated
    if (updates.variants) {
      const totals = calculateTotals(updates.variants);
      updates.totalStock = totals.totalStock;
      updates.totalValue = totals.totalValue;
    }

    // Handle barcodefield updates safely
    if (updates.barcodefield && Array.isArray(updates.barcodefield)) {
      // Use $addToSet to avoid duplicates
      const product = await Product.findByIdAndUpdate(
        productId,
        { $addToSet: { barcodefield: { $each: updates.barcodefield } }, ...updates },
        { new: true, runValidators: true }
      )
        .populate("category")
        .populate("brand");

      return res.status(200).json({
        success: true,
        message: "Product updated successfully",
        product,
      });
    }

    // Normal update if no barcodefield changes
    const product = await Product.findByIdAndUpdate(
      productId,
      updates,
      { new: true, runValidators: true }
    )
      .populate("category")
      .populate("brand");

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


/**
 * DELETE Product (from active warehouse only)
 */
exports.deleteProductFromActiveWarehouse = async (req, res) => {
  try {
    const productId = req.params.id;

    const warehouse = await Warehouse.findOne({
      createdBy: req.user._id,
      active: true,
    });

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: "No active warehouse found",
      });
    }

    const index = warehouse.products.findIndex(
      (id) => id.toString() === productId
    );

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: "Product not found in active warehouse",
      });
    }

    warehouse.products.splice(index, 1);
    await warehouse.save();

    // ⚠️ Hard delete (OK for now)
    await Product.findByIdAndDelete(productId);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};




