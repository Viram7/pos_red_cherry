 const mongoose = require("mongoose");

const schemeSeasonSchema = new mongoose.Schema(
  {
    name: { type: String, required: true}, // eg: Winter, Summer, Festive
  },
  { timestamps: true }
);

module.exports = mongoose.model("SchemeSeason", schemeSeasonSchema);
