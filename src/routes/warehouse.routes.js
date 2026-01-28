const express = require("express");
const router = express.Router();
const controller = require("../controllers/warehouse.controller");
const { verifyUserToken } = require("../middleware/auth.middleware");

// Protect all warehouse routes
router.use(verifyUserToken);

router.post("/", controller.createWarehouse);
router.get("/", controller.getAllWarehouses);
router.put("/:id", controller.updateWarehouse);
router.patch("/:id/status", controller.changeWarehouseStatus);
router.get("/active", controller.getActiveWarehouse); // optional: get current active warehouse
router.delete("/:id/hard-delete",controller.deleteWarehouseAndAllData);

module.exports = router;
