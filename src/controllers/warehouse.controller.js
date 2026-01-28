const Warehouse = require("../models/warehouse.model");

/**
 * CREATE Warehouse (user)
 */
exports.createWarehouse = async (req, res) => {
  try {
    const { name, location } = req.body;
    if (!name || !location)
      return res.status(400).json({ success: false, message: "Name & location required" });

    const warehouse = await Warehouse.create({
      name,
      location,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, data: warehouse });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET All Warehouses (user only sees their own)
 */
exports.getAllWarehouses = async (req, res) => {
  try {
    const warehouses = await Warehouse.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: warehouses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * UPDATE Warehouse (only user's own)
 */
exports.updateWarehouse = async (req, res) => {
  try {
    const { name, location } = req.body;
    const warehouse = await Warehouse.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      { name, location },
      { new: true, runValidators: true }
    );

    if (!warehouse) return res.status(404).json({ success: false, message: "Not found" });

    res.status(200).json({ success: true, data: warehouse });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * ACTIVE / DEACTIVE Warehouse (user own)
 */
exports.changeWarehouseStatus = async (req, res) => {
  try {
    const { active } = req.body;

    if (typeof active !== "boolean") {
      return res.status(400).json({ success: false, message: "Active must be boolean" });
    }

    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) return res.status(404).json({ success: false, message: "Warehouse not found" });

    if (active) {
      // Deactivate all other warehouses of this user
      await Warehouse.updateMany(
        { createdBy: req.user._id, _id: { $ne: warehouse._id } },
        { active: false }
      );
    }

    warehouse.active = active;
    await warehouse.save();

    res.status(200).json({
      success: true,
      message: `Warehouse ${active ? "activated" : "deactivated"}`,
      data: warehouse,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};


exports.getActiveWarehouse = async (req, res) => {
  try {
    const warehouse = await Warehouse.findOne({ createdBy: req.user._id, active: true })
      .populate("brands")
      .populate("categoryIds")
      .populate("paymentMethods");

    if (!warehouse) {
      return res.status(404).json({ success: false, message: "No active warehouse found" });
    }

    res.status(200).json({ success: true, data: warehouse });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};



exports.deleteWarehouseAndAllData = async (req, res) => {
  try {
    const { id } = req.params;

    const warehouse = await Warehouse.findById(id);
    if (!warehouse) {
      return res.status(404).json({ message: "Warehouse not found" });
    }

    // 🧨 Delete Products
    await Product.deleteMany({ _id: { $in: warehouse.products } });

    // 🧨 Delete Bills
    await Bill.deleteMany({ _id: { $in: warehouse.bills } });

    // 🧨 Delete Brands
    await Brand.deleteMany({ _id: { $in: warehouse.brands } });

    // 🧨 Delete Categories
    await Category.deleteMany({ _id: { $in: warehouse.categoryIds } });

    // 🧨 Delete Payment Methods
    await PaymentMethod.deleteMany({
      _id: { $in: warehouse.paymentMethods },
    });

    // 🧨 Finally delete Warehouse
    await Warehouse.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Warehouse and ALL related data deleted permanently",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};