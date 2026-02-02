const mongoose = require("mongoose");
const Invoice = require("../models/bill.model");
const Product = require("../models/product.model");
const Warehouse = require("../models/warehouse.model");


/**
 * Helper: get active warehouse
 */
const getActiveWarehouse = async (userId) => {
  return await Warehouse.findOne({ createdBy: userId, active: true });
};

/**
 * CREATE INVOICE (BARCODE BASED STOCK REDUCTION)
 */
exports.createInvoice = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      customerName,
      customerPhone,
      billNumber,
      tax,
      notes,
      items,
      cashAmount = 0,
      onlineAmount = 0,
      financeAmount = 0,
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

    /** 🔹 Reduce stock by BARCODE */
    for (const item of items) {
      const { barcode } = item;

      if (!barcode) {
        throw new Error("Barcode missing in item");
      }

      const product = await Product.findOne(
        { "variants.barcodefield": barcode },
        null,
        { session }
      );

      if (!product) {
        throw new Error(`Product not found for barcode ${barcode}`);
      }

     const variant = product.variants.find(
  (v) => String(v.barcodefield) === String(barcode)
);

      if (!variant) {
        throw new Error(`Variant not found for barcode ${barcode}`);
      }

      if (variant.quantity < 1) {
        throw new Error(`Out of stock for barcode ${barcode}`);
      }

      // 🔻 Reduce stock
      variant.quantity -= 1;

      // 🔁 Recalculate totals
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
        qty: 1, // 🔥 fixed
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

    /** 🔹 Create Invoice */
    const invoice = await Invoice.create(
      [
        {
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

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    res.status(200).json({
      success: true,
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
