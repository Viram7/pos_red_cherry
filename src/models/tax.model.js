const mongoose = require("mongoose");

const taxSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g. GST 18%
    value: { type: Number, required: true }, // 18
  },
  { timestamps: true }
);

module.exports = mongoose.model("Tax", taxSchema);
