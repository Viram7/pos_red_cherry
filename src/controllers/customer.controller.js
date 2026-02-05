const Customer = require("../models/customer.model");
const Warehouse = require("../models/warehouse.model");
const Bills = require("../models/bill.model");

/**
 * helper: get active warehouse
 */
const getActiveWarehouse = async (userId) => {
  const warehouse = await Warehouse.findOne({
    active: true,
    createdBy: userId,
  });

  if (!warehouse) {
    throw new Error("No active warehouse found");
  }

  return warehouse;
};

/**
 * CREATE CUSTOMER
 */
exports.createCustomer = async (req, res) => {
  try {
    const warehouse = await getActiveWarehouse(req.user._id);

    const customer = await Customer.create({
      ...req.body,
      warehouse: warehouse._id,
    });

    await Warehouse.findByIdAndUpdate(warehouse._id, {
      $addToSet: { customers: customer._id },
    });

    res.status(201).json(customer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * GET CUSTOMERS (ACTIVE WAREHOUSE)
 */
exports.getCustomers = async (req, res) => {
  try {
    const warehouse = await getActiveWarehouse(req.user._id);

    const customers = await Customer.find({
      warehouse: warehouse._id,
    }).sort({ createdAt: -1 });

    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET SINGLE CUSTOMER
 */
exports.getCustomerById = async (req, res) => {
  try {
    const warehouse = await getActiveWarehouse(req.user._id);

    const customer = await Customer.findOne({
      _id: req.params.id,
      warehouse: warehouse._id,
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    const customerBills = await Bills.find({customerId:customer._id});

    res.json({customer, customerBills});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * UPDATE CUSTOMER
 */
exports.updateCustomer = async (req, res) => {
  try {
    const warehouse = await getActiveWarehouse(req.user._id);

    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, warehouse: warehouse._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json(customer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * DELETE CUSTOMER
 */
exports.deleteCustomer = async (req, res) => {
  try {
    const warehouse = await getActiveWarehouse(req.user._id);

    const customer = await Customer.findOneAndDelete({
      _id: req.params.id,
      warehouse: warehouse._id,
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    await Warehouse.findByIdAndUpdate(warehouse._id, {
      $pull: { customers: customer._id },
    });

    res.json({ message: "Customer deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

