const express = require("express");
const router = express.Router();
const { verifyUserToken } = require("../middleware/auth.middleware");
const invoiceController = require("../controllers/bill.controller");

// Protect all routes
router.use(verifyUserToken);

// CRUD operations
router.post("/", invoiceController.createInvoice); // Create invoice
router.get("/", invoiceController.getInvoices); // List all invoices
router.get("/:id", invoiceController.getInvoiceById); // Get single invoice
router.put("/:id", invoiceController.updateInvoice); // Update invoice
router.delete("/:id", invoiceController.deleteInvoice); // Delete invoice
// 🔹 Receive remaining / partial payment
router.post("/receive-payment", invoiceController.receivePayment);

// 🔹 Give new promised date for remaining amount
router.post("/new-promised-date", invoiceController.addNewPromisedDate);

module.exports = router;
