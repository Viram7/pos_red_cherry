const express = require("express");
const router = express.Router();
const orderController = require("../controllers/createOrder.controller");
const { verifyUserToken } = require("../middleware/auth.middleware");
const billNumber = require("../controllers/billNumber.controller");

router.use(verifyUserToken);

router.post("/order/barcode", orderController.createOrderByBarcode);
router.get("/bill/next-number",  billNumber.getNextBillNumber);


module.exports = router;
