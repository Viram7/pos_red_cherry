const mongoose = require("mongoose");
const Invoice = require("../models/bill.model");
const Product = require("../models/product.model");
const Warehouse = require("../models/warehouse.model");
const Customers = require("../models/customer.model");


/**
 * Helper: get active warehouse
 */
const getActiveWarehouse = async (userId) => {
  return await Warehouse.findOne({ createdBy: userId, active: true });
};

/**
 * CREATE INVOICE (BARCODE BASED STOCK REDUCTION)
 */
/**
 * CREATE INVOICE (BARCODE BASED STOCK REDUCTION + AUTO CREDIT)
 */
exports.createInvoice = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      customerId,
      customerName,
      customerPhone,
      billNumber,
      tax,
      notes,
      items,

      cashAmount = 0,
      onlineAmount = 0,
      financeAmount = 0,

      // 🔹 CREDIT INPUT (only if credit exists)
      creditDate,     // promised date from frontend
      creditNote,     // optional

      extraDiscount = 0,
    } = req.body;

    if (!customerName || !customerPhone || !billNumber || !items?.length) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    /** 🔹 Active Warehouse */
    const warehouse = await getActiveWarehouse(req.user._id);
    if (!warehouse) {
      return res.status(400).json({
        success: false,
        message: "Active warehouse not found",
      });
    }

     const customer = await Customers.findById(customerId).session(session);
     if(!customer) {
      return res.status(400).json({
        success: false,
        message: "Customer not found",
      });
     }

     if(customer.creditLimit < 0) {

          return res.status(400).json({
        success: false,
        message: `Customer has ${customer.creditLimit}  credit limit`,
      });

     }
    /** 🔹 Reduce stock by BARCODE */
    for (const item of items) {
      const { barcode } = item;

      if (!barcode) throw new Error("Barcode missing in item");


const cleanBarcode = String(barcode).trim();

const product = await Product.findOne(
  { "variants.barcodefield": cleanBarcode },
  null,
  { session }
);

if (!product) {
  throw new Error(`Product not found for barcode ${cleanBarcode}`);
}

const variant = product.variants.find(v =>
  Array.isArray(v.barcodefield) &&
  v.barcodefield.includes(cleanBarcode)
);

if (!variant) {
  throw new Error(`Variant not found for barcode ${cleanBarcode}`);
}
      if (variant.quantity < 1)
        throw new Error(`Out of stock for barcode ${barcode}`);

      variant.quantity -= 1;

      let totalStock = 0;
      let totalValue = 0;

      product.variants.forEach((v) => {
        totalStock += v.quantity;
        totalValue += v.quantity * v.price;
      });

      product.totalStock = totalStock;
      product.totalValue = totalValue;

      await product.save({ session });
    }

    /** 🔹 Invoice Calculations */
    let subTotal = 0;
    let totalCost = 0;
    let totalDiscount = 0;

    const processedItems = items.map((item) => {
      const basePrice = item.rate;
      const discount = item.discount || 0;
      const total = basePrice - discount;

      totalCost += basePrice;
      totalDiscount += discount;
      subTotal += total;

      return {
        ...item,
        qty: 1,
        total,
      };
    });

    if (extraDiscount > subTotal) {
      throw new Error("Extra discount cannot exceed subtotal");
    }

    totalDiscount += extraDiscount;

    const taxableAmount = subTotal - extraDiscount;
    const taxAmount = tax?.rate ? (taxableAmount * tax.rate) / 100 : 0;
    const grandTotal = taxableAmount + taxAmount;

    /** 🔹 AUTO CREDIT CALCULATION */
    const paidNow =
      Number(cashAmount) +
      Number(onlineAmount) +
      Number(financeAmount);

    if (paidNow > grandTotal) {
      throw new Error("Paid amount cannot exceed grand total");
    }

    const creditAmount = grandTotal - paidNow;


         if(customer.creditLimit < creditAmount) {

          return res.status(400).json({
        success: false,
        message: `Customer has low credit limit`,
      });

     }


     customer.creditLimit -= creditAmount;
     await customer.save({ session });

    const remainingAmount = creditAmount;

    /** 🔹 Prepare Credit History */
    let creditHistory = [];

    if (creditAmount > 0) {
      if (!creditDate) {
        throw new Error("Credit date is required when amount is pending");
      }

      creditHistory.push({
        promisedDate: creditDate,
        amountExpected: creditAmount,
        note: creditNote || "Initial credit",
      });
    }

    /** 🔹 Create Invoice */
    const invoice = await Invoice.create(
      [
        {
          customerId,
          customerName,
          customerPhone,
          billNumber,
          tax,
          notes,

          items: processedItems,
          extraDiscount,

          cashAmount,
          onlineAmount,
          financeAmount,

          creditAmount,
          remainingAmount,
          creditHistory,

          totalCost,
          totalDiscount,
          grandTotal,

          warehouse: warehouse._id,
          createdBy: req.user._id,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      data: invoice[0],
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};




/**
 * GET ALL INVOICES
 */

exports.getInvoices = async (req, res) => {
  try {
    const warehouse = await getActiveWarehouse(req.user._id);

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: "No active warehouse found",
      });
    }

    const invoices = await Invoice.find({ warehouse: warehouse._id }).sort({
      createdAt: -1,
    });


    res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices,
  
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET INVOICE BY ID
 */
exports.getInvoiceById = async (req, res) => {
  try {
    const warehouse = await getActiveWarehouse(req.user._id);

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: "No active warehouse found",
      });
    }

    const invoice = await Invoice.findOne({
      _id: req.params.id,
      warehouse: warehouse._id,
    });

    const customer = await Customers.findById(invoice.customerId);


        if (!customer) {
      return res.status(404).json({
        success: false,
        message: "customer not found",
      });
    }
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    res.status(200).json({
      success: true,
      data: invoice,
      customer:customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * UPDATE INVOICE (items / notes only)
 */
exports.updateInvoice = async (req, res) => {
  try {
    const { items, notes } = req.body;

    if (!items && !notes) {
      return res.status(400).json({
        success: false,
        message: "Provide items or notes to update",
      });
    }

    const warehouse = await getActiveWarehouse(req.user._id);

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: "No active warehouse found",
      });
    }

    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, warehouse: warehouse._id },
      { $set: { items, notes } },
      { new: true, runValidators: true }
    );

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Invoice updated successfully",
      data: invoice,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * DELETE INVOICE
 */
exports.deleteInvoice = async (req, res) => {
  try {
    const warehouse = await getActiveWarehouse(req.user._id);

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: "No active warehouse found",
      });
    }

    const invoice = await Invoice.findOneAndDelete({
      _id: req.params.id,
      warehouse: warehouse._id,
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Invoice deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};




exports.receivePayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { invoiceId, payAmount, mode, note } = req.body;

    const invoice = await Invoice.findById(invoiceId).session(session);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    if (payAmount <= 0) {
      throw new Error("Invalid payment amount");
    }

    if (payAmount > invoice.remainingAmount) {
      throw new Error("Payment exceeds remaining amount");
    }

    // 🔹 Update payment mode amount
    if (mode === "cash") invoice.cashAmount += payAmount;
    if (mode === "online") invoice.onlineAmount += payAmount;
    if (mode === "finance") invoice.financeAmount += payAmount;

    // 🔹 Update remaining
    invoice.remainingAmount -= payAmount;

    // 🔹 Update credit history (latest pending)
    const creditEntry = invoice.creditHistory
      .slice()
      .reverse()
      .find(c => c.status !== "paid");

    if (!creditEntry) {
      throw new Error("No pending credit entry found");
    }

    creditEntry.paidAmount += payAmount;

    if (creditEntry.paidAmount >= creditEntry.amountExpected) {
      creditEntry.status = "paid";
    } else {
      creditEntry.status = "partial";
    }

    if (note) creditEntry.note = note;

      Customers.findByIdAndUpdate(
      invoice.customerId,
      { $inc: { creditLimit: payAmount } },
      { session }
    );

    
    await invoice.save({ session });
    await session.commitTransaction();

  

    res.status(200).json({
      success: true,
      message: "Payment received successfully",
      invoice,
    });

  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({
      success: false,
      message: error.message,
    });
  } finally {
    session.endSession();
  }
};



exports.addNewPromisedDate = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { invoiceId, promisedDate, note } = req.body;

    const invoice = await Invoice.findById(invoiceId).session(session);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    if (invoice.remainingAmount <= 0) {
      throw new Error("No remaining amount to promise");
    }

    // 🔹 Close last credit entry if still pending/partial
    const lastEntry = invoice.creditHistory
      .slice()
      .reverse()
      .find(c => c.status !== "paid");

    if (lastEntry) {
      lastEntry.status =
        lastEntry.paidAmount > 0 ? "partial" : "pending";
    }

    // 🔹 Create new promise
    invoice.creditHistory.push({
      promisedDate: new Date(promisedDate),
      amountExpected: invoice.remainingAmount,
      paidAmount: 0,
      status: "pending",
      note,
    });

    await invoice.save({ session });
    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: "New promised date added successfully",
      creditHistory: invoice.creditHistory,
    });

  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({
      success: false,
      message: error.message,
    });
  } finally {
    session.endSession();
  }
};
