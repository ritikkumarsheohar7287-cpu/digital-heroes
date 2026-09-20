const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const {
  calculateWinners,
  getWinners,
  approveWinner,
  rejectWinner,
  markWinnerPaid,
  uploadWinnerProof,
} = require("../controllers/winnerController");

const router = express.Router();

// =====================================
// LOGIN REQUIRED
// =====================================

router.use(authMiddleware);

// =====================================
// USER: GET OWN WINNER
// IMPORTANT: /my BEFORE /:id/proof
// =====================================

router.get("/my", async (req, res) => {
  try {
    const supabase = require("../config/supabase");

    const { data, error } = await supabase
      .from("winners")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    // =====================================
    // NO WINNER
    // =====================================

    if (!data) {
      return res.json({
        success: true,
        data: null,
      });
    }

    // =====================================
    // CREATE FRESH SIGNED URL
    // =====================================

    if (data.proof_path) {
      const {
        data: signedData,
        error: signedError,
      } = await supabase.storage
        .from("winner-proofs")
        .createSignedUrl(
          data.proof_path,
          60 * 60
        );

      if (signedError) {
        console.error(
          "Signed URL error:",
          signedError
        );
      } else {
        data.proof_url =
          signedData.signedUrl;
      }
    }

    // =====================================
    // RESPONSE
    // =====================================

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "Get my winner error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// =====================================
// USER: UPLOAD WINNER PROOF
// =====================================

router.post(
  "/:id/proof",
  uploadWinnerProof
);

// =====================================
// ADMIN ROUTES
// =====================================

router.use(adminMiddleware);

// =====================================
// GET ALL WINNERS
// =====================================

router.get(
  "/",
  getWinners
);

// =====================================
// CALCULATE WINNERS
// =====================================

router.post(
  "/calculate/:drawId",
  calculateWinners
);

// =====================================
// APPROVE WINNER
// =====================================

router.put(
  "/:id/approve",
  approveWinner
);

// =====================================
// REJECT WINNER
// =====================================

router.put(
  "/:id/reject",
  rejectWinner
);

// =====================================
// MARK WINNER AS PAID
// =====================================

router.put(
  "/:id/paid",
  markWinnerPaid
);

// =====================================
// EXPORT
// =====================================

module.exports = router;