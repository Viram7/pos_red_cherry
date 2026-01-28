const express = require("express");
const router = express.Router();
const taxController = require("../controllers/tax.controller");

const { verifyUserToken } = require("../middleware/auth.middleware");

router.use(verifyUserToken);

router.post("/", taxController.createTax);
router.get("/", taxController.getTaxes);
router.put("/:id", taxController.updateTax);
router.delete("/:id", taxController.deleteTax);

module.exports = router;
