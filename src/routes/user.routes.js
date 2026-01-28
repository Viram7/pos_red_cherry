const express = require("express");
const router = express.Router();
const { verifyUserToken } = require("../middleware/auth.middleware");
const userController = require("../controllers/user.controller");

// Protect all user routes
router.use(verifyUserToken);

// Get current user profile
router.get("/me", userController.getMyProfile);

router.get("/", userController.getAdminProfile);
router.post("/", userController.createOrUpdateAdminProfile);
router.delete("/", userController.deleteAdminProfile);
router.put("/change-name", userController.changeUserName);


module.exports = router;
