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


const CreditHistorySchema = new mongoose.Schema({
  promisedDate: {
    type: Date,
    required: true,
  },

  amountExpected: {
    type: Number,
    required: true,
  },

  paidAmount: {
    type: Number,
    default: 0,
  },

  status: {
    type: String,
    enum: ["pending", "partial", "paid"],
    default: "pending",
  },

  note: {
    type: String,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});


const InvoiceSchema = new mongoose.Schema(
  {

        customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true, // true if customer is mandatory
    },

    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerGst: { type: String },


Transport: { type: String },
From: { type: String },
TO: { type: String },
Cases: { type: String },
LR: { type: String },
TR_Date: { type: Date },


    

    billingDate: { type: Date, default: Date.now },
     billNumber: { type: String, required: true ,unique: true},  
  tax: {
    name : { type: String },
    rate : { type: Number}
    
  },

    // invoice-level payment split
    cashAmount: { type: Number, default: 0 },
    onlineAmount: { type: Number, default: 0 },
    financeAmount: { type: Number, default: 0 },
        // AUTO CALCULATED CREDIT (UDHAR)
    creditAmount: { type: Number, default: 0 },      // total udhar
    remainingAmount: { type: Number, default: 0 },   // abhi baaki

    creditHistory: [CreditHistorySchema],

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
