const Warehouse = require("../models/warehouse.model");
const SchemeSeason = require("../models/schemeSeason.model");

/**
 * ➕ CREATE SchemeSeason + attach to ACTIVE warehouse
 */
exports.createSchemeSeason = async (req, res) => {
  try {
    const warehouse = await Warehouse.findOne({ active: true });

    if (!warehouse) {
      return res.status(400).json({ message: "No active warehouse found" });
    }

    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    // duplicate check ONLY inside active warehouse
    const existingSeason = await SchemeSeason.findOne({
      name,
      _id: { $in: warehouse.schemeSeasons },
    });

    if (existingSeason) {
      return res.status(400).json({
        success: false,
        message: "Scheme season already exists in this warehouse",
      });
    }

    // create new season
    const season = await SchemeSeason.create({ name });

    warehouse.schemeSeasons.push(season._id);
    await warehouse.save();

    res.status(201).json({
      success: true,
      data: season,
      message: "Scheme season created for active warehouse",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/**
 * 📄 GET SchemeSeasons of ACTIVE warehouse
 */
exports.getSchemeSeasons = async (req, res) => {
  try {
    const warehouse = await Warehouse.findOne({ active: true }).populate(
      "schemeSeasons"
    );

    if (!warehouse) {
      return res.status(400).json({ message: "No active warehouse found" });
    }

    res.json({ success: true, data: warehouse.schemeSeasons });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/**
 * ✏️ UPDATE SchemeSeason (ACTIVE warehouse only)
 */
exports.updateSchemeSeason = async (req, res) => {
  try {
    const warehouse = await Warehouse.findOne({ active: true });
    if (!warehouse) {
      return res.status(400).json({ message: "No active warehouse found" });
    }

    // ensure belongs to active warehouse
    if (!warehouse.schemeSeasons.includes(req.params.id)) {
      return res.status(403).json({
        success: false,
        message: "Scheme season does not belong to active warehouse",
      });
    }

    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    // check duplicate inside same warehouse
    const duplicate = await SchemeSeason.findOne({
      name,
      _id: { $in: warehouse.schemeSeasons, $ne: req.params.id },
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "Scheme season name already exists in this warehouse",
      });
    }

    const season = await SchemeSeason.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: season,
      message: "Scheme season updated",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/**
 * ❌ DELETE SchemeSeason (ACTIVE warehouse only)
 * - remove from active warehouse
 * - hard delete from collection
 */
exports.deleteSchemeSeason = async (req, res) => {
  try {
    const warehouse = await Warehouse.findOne({ active: true });
    if (!warehouse) {
      return res.status(400).json({ message: "No active warehouse found" });
    }

    // ensure belongs to active warehouse
    if (!warehouse.schemeSeasons.includes(req.params.id)) {
      return res.status(403).json({
        success: false,
        message: "Scheme season does not belong to active warehouse",
      });
    }

    // remove from active warehouse
    warehouse.schemeSeasons = warehouse.schemeSeasons.filter(
      (id) => id.toString() !== req.params.id
    );
    await warehouse.save();

    // hard delete
    await SchemeSeason.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Scheme season deleted from active warehouse",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
