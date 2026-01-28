const express = require("express");
const router = express.Router();
const controller = require("../controllers/fainencer.controller");

const { verifyUserToken } = require("../middleware/auth.middleware");

router.use(verifyUserToken);

router.post("/", controller.createFinancer);
router.get("/", controller.getFinancers);
router.put("/:id", controller.updateFinancer);
router.delete("/:id", controller.deleteFinancer);


module.exports = router;
