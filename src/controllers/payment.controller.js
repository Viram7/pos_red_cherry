const mongoose = require('mongoose');
const PaymentMethod = require('../models/payments.model');
const Warehouse = require('../models/warehouse.model');

/**
 * CREATE Payment Method (added to active warehouse)
 */
exports.createPaymentMethod = async (req, res) => {
  try {
    const { name, image, description } = req.body;

    if (!name || !image || !description) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }


    const paymentMethod = await PaymentMethod.create({ name, image, description });

    // Add to active warehouse
    const activeWarehouse = await Warehouse.findOne({ createdBy: req.user._id, active: true });
    if (!activeWarehouse) 
      return res.status(400).json({ success: false, message: "No active warehouse found" });

    if (!activeWarehouse.paymentMethods) activeWarehouse.paymentMethods = [];
    activeWarehouse.paymentMethods.push(paymentMethod._id);
    await activeWarehouse.save();

    res.status(201).json({ success: true, message: "Payment Method created and added to active warehouse" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET Payment Methods in active warehouse
 */
exports.getPaymentMethodsInActiveWarehouse = async (req, res) => {
  try {
    const activeWarehouse = await Warehouse.findOne({ createdBy: req.user._id, active: true })
      .populate("paymentMethods");

    if (!activeWarehouse) 
      return res.status(404).json({ success: false, message: "No active warehouse found" });

    res.status(200).json({ success: true, data: activeWarehouse.paymentMethods });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * UPDATE Payment Method (only in active warehouse)
 */
exports.updatePaymentMethodInActiveWarehouse = async (req, res) => {
  try {
    const paymentMethodId = req.params.id;
    const updates = req.body;

    // Convert ID to ObjectId
    const objectId = new mongoose.Types.ObjectId(paymentMethodId);

    const paymentMethod = await PaymentMethod.findByIdAndUpdate(
      objectId,
      updates,
      { new: true, runValidators: true }
    );

    if (!paymentMethod) 
      return res.status(404).json({ success: false, message: "Payment Method not found" });

    // Ensure it belongs to active warehouse
    const activeWarehouse = await Warehouse.findOne({ createdBy: req.user._id, active: true });
    if (!activeWarehouse) 
      return res.status(400).json({ success: false, message: "No active warehouse found" });

    if (!activeWarehouse.paymentMethods.includes(objectId)) {
      activeWarehouse.paymentMethods.push(objectId);
      await activeWarehouse.save();
    }

    res.status(200).json({ success: true, message: "Payment Method updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE Payment Method from active warehouse only
 */


exports.deletePaymentMethodFromActiveWarehouse = async (req, res) => {
  try {
    const paymentMethodId = req.params.id;
    const objectId = new mongoose.Types.ObjectId(paymentMethodId);

    // Find the active warehouse
    const activeWarehouse = await Warehouse.findOne({ createdBy: req.user._id, active: true });
    if (!activeWarehouse)
      return res.status(400).json({ success: false, message: "No active warehouse found" });

    // Check if payment method exists in warehouse
    if (!activeWarehouse.paymentMethods.includes(objectId)) {
      return res.status(404).json({ success: false, message: "Payment Method not found in active warehouse" });
    }

    // Remove from warehouse array
    activeWarehouse.paymentMethods.pull(objectId);
    await activeWarehouse.save();

    // Delete the PaymentMethod document from DB
    const deleted = await PaymentMethod.findByIdAndDelete(objectId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Payment Method not found in database" });
    }

    res.status(200).json({ success: true, message: "Payment Method deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};