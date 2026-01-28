const mongoose = require('mongoose');

const BrandSchema = new mongoose.Schema(
  {
    code: { type: String, required: true },
    name: { type: String, required: true },
    contact: { type: String },

    categoryIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }
    ],

    email: { type: String },
    phone: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Brand', BrandSchema);
