const supabase = require("../config/supabase");
const winnerModel = require("../models/winnerModel");
const multer = require("multer");
const crypto = require("crypto");

// =====================================
// MULTER CONFIGURATION
// =====================================

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only JPG, PNG, WEBP and PDF files are allowed"
        )
      );
    }
  },
});

// =====================================
// HELPER: CONVERT NUMBERS TO ARRAY
// =====================================

const normalizeNumbers = (numbers) => {
  if (Array.isArray(numbers)) {
    return numbers.map(Number);
  }

  if (typeof numbers === "string") {
    try {
      const parsed = JSON.parse(numbers);

      if (Array.isArray(parsed)) {
        return parsed.map(Number);
      }
    } catch (error) {
      return numbers
        .replace(/[{}\[\]\\]/g, "")
        .split(",")
        .map((num) => Number(num.trim()))
        .filter((num) => !Number.isNaN(num));
    }
  }

  return [];
};

// =====================================
// UPLOAD WINNER PROOF
// =====================================

const uploadWinnerProof = [
  upload.single("proof"),

  async (req, res) => {
    try {
      const { id } = req.params;

      // =====================================
      // CHECK FILE
      // =====================================

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Proof file is required",
        });
      }

      // =====================================
      // GET WINNER
      // =====================================

      const {
        data: winner,
        error: winnerError,
      } = await supabase
        .from("winners")
        .select("*")
        .eq("id", id)
        .eq("user_id", req.user.id)
        .single();

      if (winnerError || !winner) {
        return res.status(404).json({
          success: false,
          message: "Winner not found",
        });
      }

      // =====================================
      // CHECK REJECTED WINNER
      // =====================================

      if (winner.verification_status === "rejected") {
        return res.status(400).json({
          success: false,
          message: "Rejected winners cannot upload proof",
        });
      }

      // =====================================
      // FILE EXTENSION
      // =====================================

      const extension = req.file.originalname
        .split(".")
        .pop()
        .toLowerCase();

      // =====================================
      // UNIQUE FILE PATH
      // =====================================

      const filePath =
        `${req.user.id}/` +
        `${crypto.randomUUID()}-${Date.now()}.${extension}`;

      console.log("Uploading proof:", filePath);

      // =====================================
      // UPLOAD TO SUPABASE STORAGE
      // =====================================

      const {
        error: uploadError,
      } = await supabase.storage
        .from("winner-proofs")
        .upload(
          filePath,
          req.file.buffer,
          {
            contentType: req.file.mimetype,
            upsert: false,
          }
        );

      if (uploadError) {
        console.error(
          "Proof upload error:",
          uploadError
        );

        return res.status(500).json({
          success: false,
          message: uploadError.message,
        });
      }

      // =====================================
      // SAVE FILE PATH IN DATABASE
      // =====================================

      const {
        data: updatedWinner,
        error: updateError,
      } = await supabase
        .from("winners")
        .update({
          proof_path: filePath,
          proof_url: null,
          verification_status: "pending",
          reviewed_at: null,
        })
        .eq("id", id)
        .eq("user_id", req.user.id)
        .select()
        .single();

      if (updateError) {
        console.error(
          "Winner update error:",
          updateError
        );

        return res.status(500).json({
          success: false,
          message:
            "Proof uploaded but winner record could not be updated",
        });
      }

      // =====================================
      // CREATE SIGNED URL
      // URL VALID FOR 1 HOUR
      // =====================================

      const {
        data: signedData,
        error: signedError,
      } = await supabase.storage
        .from("winner-proofs")
        .createSignedUrl(
          filePath,
          60 * 60
        );

      if (signedError) {
        console.error(
          "Signed URL error:",
          signedError
        );

        return res.status(500).json({
          success: false,
          message: signedError.message,
        });
      }

      console.log(
        "Proof signed URL created successfully"
      );

      // =====================================
      // SUCCESS RESPONSE
      // =====================================

      return res.status(200).json({
        success: true,
        message:
          "Winner proof uploaded successfully",

        data: {
          ...updatedWinner,
          proof_url:
            signedData.signedUrl,
        },
      });
    } catch (error) {
      console.error(
        "Upload proof error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Something went wrong",
      });
    }
  },
];

// =====================================
// CALCULATE WINNERS
// =====================================

const calculateWinners = async (req, res) => {
  try {
    const { drawId } = req.params;

    console.log(
      "Calculating winners for draw:",
      drawId
    );

    // =====================================
    // GET CURRENT DRAW
    // =====================================

    const {
      data: draw,
      error: drawError,
    } = await supabase
      .from("draws")
      .select("*")
      .eq("id", drawId)
      .single();

    if (drawError) {
      console.error(
        "Draw fetch error:",
        drawError
      );

      return res.status(500).json({
        success: false,
        message: drawError.message,
      });
    }

    if (!draw) {
      return res.status(404).json({
        success: false,
        message: "Draw not found",
      });
    }

    // =====================================
    // CHECK DRAW STATUS
    // =====================================

    if (draw.status !== "published") {
      return res.status(400).json({
        success: false,
        message: "Draw must be published first",
      });
    }

    // =====================================
    // GET DRAW ENTRIES
    // =====================================

    const {
      data: entries,
      error: entryError,
    } = await supabase
      .from("draw_entries")
      .select("*")
      .eq("draw_id", drawId);

    if (entryError) {
      console.error(
        "Entries fetch error:",
        entryError
      );

      return res.status(500).json({
        success: false,
        message: entryError.message,
      });
    }

    if (!entries || entries.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No entries found",
      });
    }

    console.log(
      "Total entries:",
      entries.length
    );

    // =====================================
    // PREVENT DUPLICATE CALCULATION
    // =====================================

    const entryIds = entries.map(
      (entry) => entry.id
    );

    const {
      data: existingWinners,
      error: existingError,
    } = await supabase
      .from("winners")
      .select("id")
      .in(
        "draw_entry_id",
        entryIds
      );

    if (existingError) {
      console.error(
        "Existing winner check error:",
        existingError
      );

      return res.status(500).json({
        success: false,
        message: existingError.message,
      });
    }

    if (
      existingWinners &&
      existingWinners.length > 0
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Winners have already been calculated for this draw.",
      });
    }

    // =====================================
    // WINNING NUMBERS
    // =====================================

    const winningNumbers =
      normalizeNumbers(
        draw.winning_numbers
      );

    if (
      winningNumbers.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Winning numbers not available",
      });
    }

    console.log(
      "Winning numbers:",
      winningNumbers
    );

    // =====================================
    // BASE PRIZE POOL
    // =====================================

    const basePrizePool =
      Number(
        draw.prize_pool_total
      ) || 0;

    if (basePrizePool <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "Prize pool must be greater than 0",
      });
    }

    // =====================================
    // GET PREVIOUS JACKPOT
    // =====================================

    const {
      data: previousDraws,
      error: previousError,
    } = await supabase
      .from("draws")
      .select("*")
      .eq("status", "published")
      .neq("id", drawId)
      .lt(
        "draw_date",
        draw.draw_date
      )
      .order("draw_date", {
        ascending: false,
      })
      .limit(1);

    if (previousError) {
      console.error(
        "Previous draw error:",
        previousError
      );
    }

    const previousJackpot =
      previousDraws &&
      previousDraws.length > 0
        ? Number(
            previousDraws[0].jackpot_amount
          ) || 0
        : 0;

    console.log(
      "Previous jackpot:",
      previousJackpot
    );

    // =====================================
    // TOTAL EFFECTIVE PRIZE POOL
    // =====================================

    const totalPrizePool =
      basePrizePool +
      previousJackpot;

    console.log(
      "Total prize pool:",
      totalPrizePool
    );

    // =====================================
    // PRIZE PERCENTAGES
    // =====================================

    const prizePercentages = {
      5: 0.40,
      4: 0.35,
      3: 0.25,
    };

    const results = [];

    // =====================================
    // CALCULATE MATCHES
    // =====================================

    for (const entry of entries) {
      const selectedNumbers =
        normalizeNumbers(
          entry.selected_numbers
        );

      const matchCount =
        selectedNumbers.filter(
          (number) =>
            winningNumbers.includes(
              number
            )
        ).length;

      let prizeTier = null;

      if (matchCount === 5) {
        prizeTier = "5-match";
      } else if (matchCount === 4) {
        prizeTier = "4-match";
      } else if (matchCount === 3) {
        prizeTier = "3-match";
      }

      console.log(
        `Entry ${entry.id}: ${matchCount} matches`
      );

      await winnerModel.updateEntry(
        entry.id,
        matchCount,
        prizeTier,
        0
      );

      results.push({
        entryId: entry.id,
        userId: entry.user_id,
        matchCount,
        prizeTier,
      });
    }

    // =====================================
    // PROCESS PRIZES
    // =====================================

    for (
      const matchCount of [5, 4, 3]
    ) {
      const tierWinners =
        results.filter(
          (item) =>
            item.matchCount ===
            matchCount
        );

      if (
        tierWinners.length === 0
      ) {
        continue;
      }

      const tierPool =
        totalPrizePool *
        prizePercentages[
          matchCount
        ];

      const prizePerWinner =
        tierPool /
        tierWinners.length;

      console.log(
        `${matchCount}-match winners:`,
        tierWinners.length
      );

      console.log(
        "Tier pool:",
        tierPool
      );

      console.log(
        "Prize per winner:",
        prizePerWinner
      );

      for (
        const winner of tierWinners
      ) {
        await winnerModel.updateEntry(
          winner.entryId,
          winner.matchCount,
          winner.prizeTier,
          prizePerWinner
        );

        await winnerModel.createWinner(
          winner.entryId,
          winner.userId,
          prizePerWinner
        );
      }
    }

    // =====================================
    // JACKPOT ROLLOVER
    // =====================================

    const fiveMatchWinners =
      results.filter(
        (item) =>
          item.matchCount === 5
      );

    let jackpotRollover = 0;

    if (
      fiveMatchWinners.length === 0
    ) {
      jackpotRollover =
        totalPrizePool *
        prizePercentages[5];

      console.log(
        "No 5-match winner."
      );

      console.log(
        "Jackpot rollover:",
        jackpotRollover
      );
    } else {
      jackpotRollover = 0;

      console.log(
        "5-match winner found."
      );

      console.log(
        "Jackpot won."
      );
    }

    // =====================================
    // UPDATE CURRENT DRAW
    // =====================================

    const {
      error: jackpotError,
    } = await supabase
      .from("draws")
      .update({
        jackpot_amount:
          jackpotRollover,
      })
      .eq("id", drawId);

    if (jackpotError) {
      throw jackpotError;
    }

    // =====================================
    // SUCCESS RESPONSE
    // =====================================

    return res.status(200).json({
      success: true,
      message:
        "Winner calculation completed",
      basePrizePool,
      previousJackpot,
      totalPrizePool,
      winningNumbers,
      jackpotRollover,
      fiveMatchWinners:
        fiveMatchWinners.length,
      results,
    });
  } catch (error) {
    console.error(
      "Winner calculation error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Something went wrong",
    });
  }
};

// =====================================
// GET ALL WINNERS
// =====================================

const getWinners = async (req, res) => {
  try {
    const data =
      await winnerModel.getAllWinners();

    // =====================================
    // CREATE FRESH SIGNED URLS
    // =====================================

    const winnersWithProofUrls =
      await Promise.all(
        data.map(async (winner) => {
          let proofUrl = null;

          if (winner.proof_path) {
            const {
              data: signedData,
              error: signedError,
            } = await supabase.storage
              .from("winner-proofs")
              .createSignedUrl(
                winner.proof_path,
                60 * 60
              );

            if (signedError) {
              console.error(
                `Signed URL error for winner ${winner.id}:`,
                signedError
              );
            } else {
              proofUrl =
                signedData?.signedUrl ||
                null;
            }
          }

          return {
            ...winner,
            proof_url: proofUrl,
          };
        })
      );

    return res.status(200).json({
      success: true,
      count:
        winnersWithProofUrls.length,
      data: winnersWithProofUrls,
    });
  } catch (error) {
    console.error(
      "Get winners error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to load winners",
    });
  }
};

// =====================================
// APPROVE WINNER
// =====================================

const approveWinner = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const data =
      await winnerModel.updateVerification(
        id,
        "approved"
      );

    return res.status(200).json({
      success: true,
      message:
        "Winner approved successfully",
      data,
    });
  } catch (error) {
    console.error(
      "Approve winner error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================
// REJECT WINNER
// =====================================

const rejectWinner = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const data =
      await winnerModel.updateVerification(
        id,
        "rejected"
      );

    return res.status(200).json({
      success: true,
      message:
        "Winner rejected successfully",
      data,
    });
  } catch (error) {
    console.error(
      "Reject winner error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================
// MARK WINNER AS PAID
// =====================================

const markWinnerPaid = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const {
      data: winner,
      error: winnerError,
    } = await supabase
      .from("winners")
      .select("*")
      .eq("id", id)
      .single();

    if (
      winnerError ||
      !winner
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Winner not found",
      });
    }

    // =====================================
    // PAYMENT ONLY AFTER APPROVAL
    // =====================================

    if (
      winner.verification_status !==
      "approved"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Winner must be approved before payment",
      });
    }

    // =====================================
    // ALREADY PAID
    // =====================================

    if (
      winner.payment_status ===
      "paid"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Winner payment is already marked as paid",
      });
    }

    const data =
      await winnerModel.markPaid(
        id
      );

    return res.status(200).json({
      success: true,
      message:
        "Winner payment marked as paid",
      data,
    });
  } catch (error) {
    console.error(
      "Mark paid error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================
// EXPORT
// =====================================

module.exports = {
  calculateWinners,
  getWinners,
  approveWinner,
  rejectWinner,
  markWinnerPaid,
  uploadWinnerProof,
};