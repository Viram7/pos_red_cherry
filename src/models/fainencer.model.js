const mongoose = require('mongoose');

const financerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Financer', financerSchema);
