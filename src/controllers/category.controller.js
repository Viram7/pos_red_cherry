const Category = require("../models/category.model");
const Warehouse = require("../models/warehouse.model");

/**
 * CREATE Category (added to active warehouse)
 */
exports.createCategory = async (req, res) => {
  try {
    const { code, name, description, barcodeField, fields = [] } = req.body;

    if (!code || !name) {
      return res.status(400).json({ success: false, message: "Code and Name are required" });
    }

    // Prevent duplicate category code
    const existing = await Category.findOne({ code });
    if (existing) {
      return res.status(400).json({ success: false, message: "Category code already exists" });
    }

    // Create category
    const category = await Category.create({ code, name, description, barcodeField, fields });

    // Add to active warehouse
    const activeWarehouse = await Warehouse.findOne({ createdBy: req.user._id, active: true });
    if (!activeWarehouse) {
      return res.status(400).json({ success: false, message: "No active warehouse found" });
    }

    activeWarehouse.categoryIds.push(category._id);
    await activeWarehouse.save();
    await activeWarehouse.populate("categoryIds");

    res.status(201).json({ success: true, category,});
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET Categories in active warehouse
 */
exports.getCategoriesInActiveWarehouse = async (req, res) => {
  try {
    const activeWarehouse = await Warehouse.findOne({ createdBy: req.user._id, active: true })
      .populate("categoryIds");

    if (!activeWarehouse) {
      return res.status(404).json({ success: false, message: "No active warehouse found" });
    }

    res.status(200).json({ success: true, data: activeWarehouse.categoryIds });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * UPDATE Category (ensures it remains in active warehouse)
 */
exports.updateCategoryInActiveWarehouse = async (req, res) => {
  try {
    const { code, name, description, barcodeField, fields } = req.body;
    const categoryId = req.params.id;

    // Prevent duplicate code
    if (code) {
      const duplicate = await Category.findOne({ code, _id: { $ne: categoryId } });
      if (duplicate) return res.status(400).json({ success: false, message: "Category code already exists" });
    }

    // Update category
    const category = await Category.findByIdAndUpdate(
      categoryId,
      { code, name, description, barcodeField, fields },
      { new: true, runValidators: true }
    );

    if (!category) return res.status(404).json({ success: false, message: "Category not found" });

    // Ensure it is linked to active warehouse
    const activeWarehouse = await Warehouse.findOne({ createdBy: req.user._id, active: true });
    if (!activeWarehouse) return res.status(400).json({ success: false, message: "No active warehouse found" });

    if (!activeWarehouse.categoryIds.includes(category._id)) {
      activeWarehouse.categoryIds.push(category._id);
      await activeWarehouse.save();
    }

    await activeWarehouse.populate("categoryIds");

    res.status(200).json({
      success: true,
      message: "Category updated and linked to active warehouse",
      category,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE Category from active warehouse only
 */
exports.deleteCategoryFromActiveWarehouse = async (req, res) => {
  try {
    const categoryId = req.params.id;

    const activeWarehouse = await Warehouse.findOne({ createdBy: req.user._id, active: true });
    if (!activeWarehouse) {
      return res.status(400).json({ success: false, message: "No active warehouse found" });
    }

    const index = activeWarehouse.categoryIds.indexOf(categoryId);
    if (index === -1) {
      return res.status(404).json({ success: false, message: "Category not found in active warehouse" });
    }

    activeWarehouse.categoryIds.splice(index, 1); // remove from array
    await activeWarehouse.save();
    await activeWarehouse.populate("categoryIds");

    res.status(200).json({
      success: true,
      message: "Category removed from active warehouse",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
