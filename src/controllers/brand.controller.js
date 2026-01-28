const Brand = require("../models/brand.model");
const Warehouse = require("../models/warehouse.model");

/**
 * CREATE Brand (added to active warehouse)
 */
exports.createBrand = async (req, res) => {
  try {
    const { code, name, contact, email, phone, categoryIds = [] } = req.body;

    if (!code || !name) {
      return res.status(400).json({ success: false, message: "Code and Name are required" });
    }

    // Prevent duplicate brand code
    const existing = await Brand.findOne({ code });
    if (existing) {
      return res.status(400).json({ success: false, message: "Brand code already exists" });
    }

    // Create brand
    const brand = await Brand.create({ code, name, contact, email, phone, categoryIds });

    // Add to active warehouse
    const activeWarehouse = await Warehouse.findOne({ createdBy: req.user._id, active: true });
    if (!activeWarehouse) {
      return res.status(400).json({ success: false, message: "No active warehouse found" });
    }

    activeWarehouse.brands.push(brand._id);
    await activeWarehouse.save();
    await activeWarehouse.populate("brands");

    res.status(201).json({ success: true, brand,});
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET Brands in active warehouse
 */
exports.getBrandsInActiveWarehouse = async (req, res) => {
  try {
    const activeWarehouse = await Warehouse.findOne({ createdBy: req.user._id, active: true })
      .populate("brands");

    if (!activeWarehouse) {
      return res.status(404).json({ success: false, message: "No active warehouse found" });
    }

    res.status(200).json({ success: true, data: activeWarehouse.brands });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * UPDATE Brand in active warehouse
 */
exports.updateBrandInActiveWarehouse = async (req, res) => {
  try {
    const { code, name, contact, email, phone, categoryIds } = req.body;
    const brandId = req.params.id;

    // Prevent duplicate code
    if (code) {
      const duplicate = await Brand.findOne({ code, _id: { $ne: brandId } });
      if (duplicate) return res.status(400).json({ success: false, message: "Brand code already exists" });
    }

    const brand = await Brand.findByIdAndUpdate(
      brandId,
      { code, name, contact, email, phone, categoryIds },
      { new: true, runValidators: true }
    );

    if (!brand) return res.status(404).json({ success: false, message: "Brand not found" });

    // Ensure it is linked to active warehouse
    const activeWarehouse = await Warehouse.findOne({ createdBy: req.user._id, active: true });
    if (!activeWarehouse) return res.status(400).json({ success: false, message: "No active warehouse found" });

    if (!activeWarehouse.brands.includes(brand._id)) {
      activeWarehouse.brands.push(brand._id);
      await activeWarehouse.save();
    }

    await activeWarehouse.populate("brands");

    res.status(200).json({
      success: true,
      message: "Brand updated and linked to active warehouse",
      brand,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE Brand from active warehouse only
 */
exports.deleteBrandFromActiveWarehouse = async (req, res) => {
  try {
    const brandId = req.params.id;

    const activeWarehouse = await Warehouse.findOne({ createdBy: req.user._id, active: true });
    if (!activeWarehouse) {
      return res.status(400).json({ success: false, message: "No active warehouse found" });
    }

    const index = activeWarehouse.brands.indexOf(brandId);
    if (index === -1) {
      return res.status(404).json({ success: false, message: "Brand not found in active warehouse" });
    }

    activeWarehouse.brands.splice(index, 1); // remove from array
    await activeWarehouse.save();
    await activeWarehouse.populate("brands");

    res.status(200).json({
      success: true,
      message: "Brand removed from active warehouse",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
