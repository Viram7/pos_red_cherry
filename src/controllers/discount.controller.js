const DiscountScheme = require("../models/discount.model");
const Warehouse = require("../models/warehouse.model");

/**
 * CREATE Discount Scheme (added to active warehouse)
 */
exports.createDiscount = async (req, res) => {
  try {
    const {
      name,
      
      minPurchase = 0,
      maxDiscount,
      validFrom,
      validTo,
      description,
      season = "regular",
      categories = [],
      brands = [],
      models = [],
      variants = [],
      paymentMethods = [],
    } = req.body;

    if (!name || !validFrom || !validTo) {
      return res.status(400).json({
        success: false,
        message: "Name, maxDiscount,  validFrom, and validTo are required",
      });
    }

    // Create discount scheme
    const discount = await DiscountScheme.create({
      name,
    
      minPurchase,
      maxDiscount,
      validFrom,
      validTo,
      description,
      season,
      categories,
      brands,
      models,
      variants,
      paymentMethods,
    });

    // Add to active warehouse
    const activeWarehouse = await Warehouse.findOne({ createdBy: req.user._id, active: true });
    if (!activeWarehouse) {
      return res.status(400).json({ success: false, message: "No active warehouse found" });
    }

    if (!activeWarehouse.discounts) activeWarehouse.discounts = [];
    activeWarehouse.discounts.push(discount._id);
    await activeWarehouse.save();
    await activeWarehouse.populate("discounts");

    res.status(201).json({ success: true, discount,});
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET Discounts in active warehouse
 */
exports.getDiscountsInActiveWarehouse = async (req, res) => {
  try {
    const activeWarehouse = await Warehouse.findOne({ createdBy: req.user._id, active: true })
      .populate({
        path: "discounts",
        populate: ["categories", "brands"]
      });

    if (!activeWarehouse) {
      return res.status(404).json({ success: false, message: "No active warehouse found" });
    }

    res.status(200).json({ success: true, data: activeWarehouse.discounts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * UPDATE Discount Scheme (in active warehouse)
 */
exports.updateDiscountInActiveWarehouse = async (req, res) => {
  try {
    const discountId = req.params.id;
    const updates = req.body;

    const discount = await DiscountScheme.findByIdAndUpdate(
      discountId,
      updates,
      { new: true, runValidators: true }
    ).populate("categories").populate("brands");

    if (!discount) return res.status(404).json({ success: false, message: "Discount scheme not found" });

    // Ensure it belongs to active warehouse
    const activeWarehouse = await Warehouse.findOne({ createdBy: req.user._id, active: true });
    if (!activeWarehouse) return res.status(400).json({ success: false, message: "No active warehouse found" });

    if (!activeWarehouse.discounts.includes(discount._id)) {
      activeWarehouse.discounts.push(discount._id);
      await activeWarehouse.save();
    }

    await activeWarehouse.populate("discounts");

    res.status(200).json({
      success: true,
      message: "Discount updated and linked to active warehouse",
      discount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE Discount from active warehouse only
 */
exports.deleteDiscountFromActiveWarehouse = async (req, res) => {
  try {
    const discountId = req.params.id;

    const activeWarehouse = await Warehouse.findOne({ createdBy: req.user._id, active: true });
    if (!activeWarehouse) return res.status(400).json({ success: false, message: "No active warehouse found" });

    const index = activeWarehouse.discounts.indexOf(discountId);
    if (index === -1) return res.status(404).json({ success: false, message: "Discount not found in active warehouse" });

    activeWarehouse.discounts.splice(index, 1);
    await activeWarehouse.save();
    await activeWarehouse.populate("discounts");

    res.status(200).json({
      success: true,
      message: "Discount removed from active warehouse",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};



/**
 * DEACTIVATE Discount Scheme (in active warehouse)
 */
exports.deactivateDiscountInActiveWarehouse = async (req, res) => {
  try {
    const discountId = req.params.id;

    // Find active warehouse
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

    // Check if discount belongs to warehouse
    if (!activeWarehouse.discounts.includes(discountId)) {
      return res.status(404).json({
        success: false,
        message: "Discount not found in active warehouse",
      });
    }

    // Deactivate discount
    const discount = await DiscountScheme.findByIdAndUpdate(
      discountId,
      { isActive: false },
      { new: true }
    );

    if (!discount) {
      return res.status(404).json({
        success: false,
        message: "Discount scheme not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Discount deactivated successfully",
      discount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};




/**
 * ACTIVATE Discount Scheme (in active warehouse)
 */
exports.activateDiscountInActiveWarehouse = async (req, res) => {
  try {
    const discountId = req.params.id;

    // Find active warehouse
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

    // Check if discount belongs to warehouse
    if (!activeWarehouse.discounts.includes(discountId)) {
      return res.status(404).json({
        success: false,
        message: "Discount not found in active warehouse",
      });
    }

    // Activate discount
    const discount = await DiscountScheme.findByIdAndUpdate(
      discountId,
      { isActive: true },
      { new: true }
    );

    if (!discount) {
      return res.status(404).json({
        success: false,
        message: "Discount scheme not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Discount activated successfully",
      discount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
