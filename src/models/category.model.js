const mongoose = require('mongoose');

const CategoryFieldSchema = new mongoose.Schema({
  name: { type: String, required: true }
});

const CategorySchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String },
    barcodeField: { type: String },

    fields: [CategoryFieldSchema],


    productIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', CategorySchema);
