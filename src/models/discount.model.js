const mongoose = require("mongoose");

const DiscountSchemeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    minPurchase: { type: Number, default: 0 },
    maxDiscount: { type: Number },

    validFrom: { type: Date, required: true },
    validTo: { type: Date, required: true },

    isActive: { type: Boolean, default: true },

    description: { type: String },

season: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "SchemeSeason",
  required: true,
},


    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],

    brands: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Brand",
      },
    ],
    models: [{ type: String }],
    variants: [{ type: String }],
    paymentMethods: [{ type: String }],

    usageCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DiscountScheme", DiscountSchemeSchema);
