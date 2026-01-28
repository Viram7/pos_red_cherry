// src/models/warehouse.model.js
const mongoose = require("mongoose");

const WarehouseSchema = new mongoose.Schema(
  {
    active: { type: Boolean, default: false },
    name: { type: String, required: true },
    location: { type: String, required: true },
    brands: [{ type: mongoose.Schema.Types.ObjectId, ref: "Brand" }],
    categoryIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
    paymentMethods: [
      { type: mongoose.Schema.Types.ObjectId, ref: "PaymentMethod" },
    ],
    // Add in Warehouse model
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    discounts: [
      { type: mongoose.Schema.Types.ObjectId, ref: "DiscountScheme" },
    ],
    schemeSeasons: [
  { type: mongoose.Schema.Types.ObjectId, ref: "SchemeSeason" },
],


    bills: [{ type: mongoose.Schema.Types.ObjectId, ref: "Bill" }],

    financers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Financer" }],

    taxes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tax" }],




    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Warehouse", WarehouseSchema);
