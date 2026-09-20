const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");

const {
  addScore,
  getScores,
  updateScore,
  deleteScore,
} = require("../controllers/scoreController");

const router = express.Router();

router.use(authMiddleware);

router.post("/", addScore);
router.get("/", getScores);
router.put("/:id", updateScore);
router.delete("/:id", deleteScore);

module.exports = router;