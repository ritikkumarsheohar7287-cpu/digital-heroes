const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");

const {
  createEntry,
  getEntries,
} = require("../controllers/drawEntryController");

const router = express.Router();

router.use(authMiddleware);

router.post("/", createEntry);
router.get("/:drawId", getEntries);

module.exports = router;