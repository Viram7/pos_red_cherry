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
 * CREATE INVOICE
 */
exports.createInvoice = async (req, res) => {
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

    const warehouse = await Warehouse.findOne({
      createdBy: req.user._id,
      active: true,
    });

    if (!warehouse) {
      return res.status(400).json({
        success: false,
        message: "Active warehouse not found",
      });
    }

    /* 🔹 Calculate totals */
    let subTotal = 0;
    let totalCost = 0; // ✅ REQUIRED
    let totalDiscount = 0;

    const processedItems = items.map((item) => {
      const basePrice = item.qty * item.rate;
      const itemDiscount = item.discount || 0;
      const itemTotal = basePrice - itemDiscount;

      totalCost += basePrice; // ✅
      totalDiscount += itemDiscount; // ✅
      subTotal += itemTotal;

      return {
        ...item,
        total: itemTotal,
      };
    });

    if (extraDiscount > subTotal) {
      return res.status(400).json({
        success: false,
        message: "Extra discount cannot exceed subtotal",
      });
    }

    totalDiscount += extraDiscount; // ✅ include invoice-level discount

    const taxableAmount = subTotal - extraDiscount;
    const taxAmount = tax?.rate ? (taxableAmount * tax.rate) / 100 : 0;

    const grandTotal = taxableAmount + taxAmount;

    /* 🔹 Create Invoice */
    const invoice = await Invoice.create({
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
    });

    res.status(201).json({
      success: true,
      message: "Invoice created successfully",
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
