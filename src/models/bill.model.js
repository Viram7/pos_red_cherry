const mongoose = require("mongoose");

const ExtraFieldSchema = new mongoose.Schema({
  key: { type: String, required: true },
  value: { type: String },
});

const ItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },


  qty: { type: Number, required: true },
  rate: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },

  // per-item payment splits
  itemCash: { type: Number, default: 0 },
  itemOnline: { type: Number, default: 0 },
  itemFinance: { type: Number, default: 0 },


  // financer (no EMI details)
  financerId: { type: String },

  // extra fields like code, imei, etc.
  
});

const InvoiceSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerGst: { type: String },

    billingDate: { type: Date, default: Date.now },
     billNumber: { type: String, required: true},
  tax: {
    name : { type: String },
    rate : { type: Number}
    
  },

    // invoice-level payment split
    cashAmount: { type: Number, default: 0 },
    onlineAmount: { type: Number, default: 0 },
    financeAmount: { type: Number, default: 0 },

    extraDiscount: { type: Number, default: 0 },


    totalCost: { type: Number, required: true },
    totalDiscount: { type: Number, required: true },

    grandTotal: { type: Number, required: true },


    items: [ItemSchema],

    notes: { type: String },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invoice", InvoiceSchema);
