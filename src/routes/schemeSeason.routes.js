const express = require("express");
const router = express.Router();

const {
  createSchemeSeason,
  getSchemeSeasons,
  updateSchemeSeason,
  deleteSchemeSeason,
} = require("../controllers/schemeSeason.controller");

const { verifyUserToken } = require("../middleware/auth.middleware");

router.use(verifyUserToken);

// ======================
// 🔹 SchemeSeason Routes
// ======================

// Create a Scheme Season
router.post("/", createSchemeSeason);

// Get all Scheme Seasons (active warehouse)
router.get("/", getSchemeSeasons);

// Update Scheme Season by ID (active warehouse only)
router.put("/:id", updateSchemeSeason);

// Delete Scheme Season by ID (active warehouse only)
router.delete("/:id", deleteSchemeSeason);

module.exports = router;
