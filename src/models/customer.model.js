const mongoose = require("mongoose");

const CustomerSchema = new mongoose.Schema(
  {
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    number1: {
      type: String,
      required: true,
    },

    number2: String,

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    address: {
      type: String,
      required: true,
    },

    creditLimit: {
      type: Number,
      default: 0,
    },

    state: String,
    stateCode: String,
    GSTIN: String,
    adhar: String,
    pan: String,
    image: String,

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Customer", CustomerSchema);
