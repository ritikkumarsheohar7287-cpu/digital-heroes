const express = require("express");

const {
  testDB,
} = require("../controllers/testController");

const authMiddleware = require("../middleware/authMiddleware");

const supabase = require("../config/supabase");

const router = express.Router();


// Database test
router.get("/db", testDB);


// Protected test
router.get("/protected", authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: "Protected route accessed successfully 🔐",
    user: req.user,
  });
});


// Draw table test
router.get("/draw-test", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("draws")
      .select("*");

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
        code: error.code,
      });
    }

    res.json({
      success: true,
      message: "Draw table access working",
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


module.exports = router;