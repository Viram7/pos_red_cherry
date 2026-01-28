const Warehouse = require("../models/warehouse.model");
const Tax = require("../models/tax.model");

/**
 * ➕ CREATE TAX + attach to ACTIVE warehouse
 */
exports.createTax = async (req, res) => {
  try {
    const warehouse = await Warehouse.findOne({ active: true });

    if (!warehouse) {
      return res.status(400).json({ message: "No active warehouse found" });
    }

    const { name, value } = req.body;
    if (!name || !value) {
      return res.status(400).json({ message: "Name and value are required" });
    }

    // duplicate check ONLY inside active warehouse
    const existingTax = await Tax.findOne({
      name,
      _id: { $in: warehouse.taxes },
    });

    if (existingTax) {
      return res.status(400).json({
        success: false,
        message: "Tax already exists in this warehouse",
      });
    }

    // create new tax
    const tax = await Tax.create({ name, value });

    warehouse.taxes.push(tax._id);
    await warehouse.save();

    res.status(201).json({
      success: true,
      data: tax,
      message: "Tax created for active warehouse",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * 📄 GET TAXES of ACTIVE warehouse
 */
exports.getTaxes = async (req, res) => {
  try {
    const warehouse = await Warehouse.findOne({ active: true }).populate(
      "taxes"
    );

    if (!warehouse) {
      return res.status(400).json({ message: "No active warehouse found" });
    }

    res.json({ success: true, data: warehouse.taxes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * ✏️ UPDATE TAX (ACTIVE warehouse only)
 */
exports.updateTax = async (req, res) => {
  try {
    const warehouse = await Warehouse.findOne({ active: true });
    if (!warehouse) {
      return res.status(400).json({ message: "No active warehouse found" });
    }

    // ensure belongs to active warehouse
    if (!warehouse.taxes.includes(req.params.id)) {
      return res.status(403).json({
        success: false,
        message: "Tax does not belong to active warehouse",
      });
    }

    const { name, value } = req.body;
    if (!name || !value) {
      return res.status(400).json({ message: "Name and value are required" });
    }

    // check duplicate inside same warehouse
    const duplicate = await Tax.findOne({
      name,
      _id: { $in: warehouse.taxes, $ne: req.params.id },
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "Tax name already exists in this warehouse",
      });
    }

    const tax = await Tax.findByIdAndUpdate(
      req.params.id,
      { name, value },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: tax,
      message: "Tax updated",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * ❌ HARD DELETE TAX (ACTIVE warehouse only)
 */
exports.deleteTax = async (req, res) => {
  try {
    const warehouse = await Warehouse.findOne({ active: true });
    if (!warehouse) {
      return res.status(400).json({ message: "No active warehouse found" });
    }

    // ensure belongs to active warehouse
    if (!warehouse.taxes.includes(req.params.id)) {
      return res.status(403).json({
        success: false,
        message: "Tax does not belong to active warehouse",
      });
    }

    // remove from active warehouse
    warehouse.taxes = warehouse.taxes.filter(
      (id) => id.toString() !== req.params.id
    );
    await warehouse.save();

    // hard delete
    await Tax.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Tax HARD deleted from active warehouse",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
