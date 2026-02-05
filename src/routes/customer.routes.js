const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customer.controller");

const { verifyUserToken } = require("../middleware/auth.middleware"); // JWT auth

// All routes require authentication
router.use(verifyUserToken);
// assume auth middleware sets req.user
router.post("/", customerController.createCustomer);
router.get("/", customerController.getCustomers);
router.get("/:id", customerController.getCustomerById);
router.put("/:id", customerController.updateCustomer);
router.delete("/:id", customerController.deleteCustomer);


module.exports = router;
