

const mongoose = require("mongoose");

/**
 * COMMON PRODUCT FIELDS
 * (applies to all variants)
 */
const ProductFieldSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false }
);

/**
 * VARIANT-SPECIFIC FIELDS
 * (size, color, etc.)
 */
const VariantFieldSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false }
);

/**
 * VARIANT SCHEMA
 */
const VariantSchema = new mongoose.Schema(
  {
    variantSku: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    quantity: {
      type: Number,
      required: true,
      min: 0,
    },

    barcodefield: {
      type: [String],
  default: [],
  validate: {
    validator: function (arr) {
      return arr.length === new Set(arr).size;
    },
    message: "Duplicate barcodes are not allowed"
  }
    },

    fields: {
      type: [VariantFieldSchema],
      required: true,
    },
  },
  { _id: false }
);

/**
 * PRODUCT SCHEMA
 */
const ProductSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },

    barcodefieldName: {
      type: String,
      default: "Barcode",
    },

    /**
     * ✅ COMMON PRODUCT FIELDS
     */
    productFields: {
      type: [ProductFieldSchema],
      default: [],
    },

    description: {
      type: String,
    },

    /**
     * ✅ VARIANTS
     */
    variants: {
      type: [VariantSchema],
      required: true,
    },

    /**
     * Calculated fields
     */
    totalStock: {
      type: Number,
      default: 0,
    },

    totalValue: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

/**
 * Indexes
 */
ProductSchema.index({ sku: 1 });
ProductSchema.index({ "variants.variantSku": 1 });

module.exports = mongoose.model("Product", ProductSchema);
