const Warehouse = require("../models/warehouse.model");
const Financer = require("../models/fainencer.model");

/**
 * ➕ CREATE Financer (ACTIVE warehouse only)
 */
exports.createFinancer = async (req, res) => {
  try {
    const warehouse = await Warehouse.findOne({ active: true });
    if (!warehouse) {
      return res.status(400).json({ message: "No active warehouse found" });
    }

    const { name ,email,phone } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    // check if financer already exists in collection
    let financer = await Financer.findOne({ name });

    // create if not exists
    if (!financer) {
      financer = await Financer.create({ name, email, phone });
    }

    // attach to active warehouse if not already attached
    const exists = warehouse.financers.some((id) =>
      id.equals(financer._id)
    );

    if (!exists) {
      warehouse.financers.push(financer._id);
      await warehouse.save();
    }

    res.status(201).json({ success: true, data: financer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * 📄 GET Financers (ACTIVE warehouse only)
 */
exports.getFinancers = async (req, res) => {
  try {
    const warehouse = await Warehouse.findOne({ active: true }).populate(
      "financers"
    );

    if (!warehouse) {
      return res.status(400).json({ message: "No active warehouse found" });
    }

    res.json({ success: true, data: warehouse.financers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * ✏️ UPDATE Financer (ACTIVE warehouse only)
 */
exports.updateFinancer = async (req, res) => {
  try {
    const warehouse = await Warehouse.findOne({ active: true });
    if (!warehouse) {
      return res.status(400).json({ message: "No active warehouse found" });
    }

    const belongs = warehouse.financers.some((id) =>
      id.equals(req.params.id)
    );

    if (!belongs) {
      return res.status(403).json({
        message: "Financer does not belong to active warehouse",
      });
    }

    const financer = await Financer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!financer) {
      return res.status(404).json({ message: "Financer not found" });
    }

    res.json({ success: true, data: financer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * ❌ HARD DELETE Financer (ACTIVE warehouse only)
 */
exports.deleteFinancer = async (req, res) => {
  try {
    const warehouse = await Warehouse.findOne({ active: true });
    if (!warehouse) {
      return res.status(400).json({ message: "No active warehouse found" });
    }

    const belongs = warehouse.financers.some((id) =>
      id.equals(req.params.id)
    );

    if (!belongs) {
      return res.status(403).json({
        message: "Financer does not belong to active warehouse",
      });
    }

    // remove from active warehouse
    warehouse.financers = warehouse.financers.filter(
      (id) => !id.equals(req.params.id)
    );
    await warehouse.save();

    // hard delete from collection
    await Financer.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Financer HARD deleted from active warehouse",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
