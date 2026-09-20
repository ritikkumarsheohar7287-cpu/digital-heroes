const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const {
  createDraw,
  getDraws,
  simulateDraw,
  publishDraw,
  getPublishedDraw,
} = require("../controllers/drawController");

const router = express.Router();

// Authentication required for all draw routes
router.use(authMiddleware);

// Normal logged-in users can view published draw
router.get("/published", getPublishedDraw);

// Admin authentication required from here
router.use(adminMiddleware);

// Admin: create draw
router.post("/", createDraw);

// Admin: get all draws
router.get("/", getDraws);

// Admin: simulate draw
router.post("/:id/simulate", simulateDraw);

// Admin: publish draw
router.post("/:id/publish", publishDraw);

module.exports = router;