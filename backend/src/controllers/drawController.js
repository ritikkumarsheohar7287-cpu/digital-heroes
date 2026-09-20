const drawModel = require("../models/drawModel");
const supabase = require("../config/supabase");

// =========================================
// CREATE DRAW
// =========================================

const createDraw = async (req, res) => {
  try {
    const {
      drawDate,
      drawType,
      drawMode,
    } = req.body;

    // Required fields
    if (!drawDate || !drawType || !drawMode) {
      return res.status(400).json({
        success: false,
        message:
          "Draw date, type and mode are required",
      });
    }

    // Validate draw type
    const validDrawTypes = [
      "5-number",
      "4-number",
      "3-number",
    ];

    if (!validDrawTypes.includes(drawType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid draw type",
      });
    }

    // Validate draw mode
    const validDrawModes = [
      "random",
      "weighted",
    ];

    if (!validDrawModes.includes(drawMode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid draw mode",
      });
    }

    // Prevent past dates
    const today = new Date()
      .toISOString()
      .split("T")[0];

    if (drawDate < today) {
      return res.status(400).json({
        success: false,
        message:
          "Draw date cannot be in the past",
      });
    }

    const data =
      await drawModel.createDraw(
        drawDate,
        drawType,
        drawMode
      );

    return res.status(201).json({
      success: true,
      message:
        "Draw created successfully",
      data,
    });
  } catch (error) {
    console.error(
      "Create draw error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to create draw",
    });
  }
};

// =========================================
// GET ALL DRAWS
// =========================================

const getDraws = async (req, res) => {
  try {
    const data =
      await drawModel.getDraws();

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error(
      "Get draws error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to load draws",
    });
  }
};

// =========================================
// GET SCORE FREQUENCY
// =========================================

const getScoreFrequency = async () => {
  try {
    const {
      data,
      error,
    } = await supabase
      .from("scores")
      .select("score");

    if (error) {
      throw error;
    }

    const frequency = {};

    // Initialize 1-45
    for (let number = 1; number <= 45; number++) {
      frequency[number] = 0;
    }

    // Count score frequency
    for (const row of data || []) {
      const score = Number(row.score);

      if (
        score >= 1 &&
        score <= 45
      ) {
        frequency[score]++;
      }
    }

    return frequency;
  } catch (error) {
    console.error(
      "Score frequency error:",
      error
    );

    // If score fetching fails,
    // return equal frequency.
    const frequency = {};

    for (let number = 1; number <= 45; number++) {
      frequency[number] = 1;
    }

    return frequency;
  }
};

// =========================================
// RANDOM NUMBER GENERATOR
// =========================================

const generateRandomNumbers = (
  count
) => {
  const numbers = [];

  while (
    numbers.length < count
  ) {
    const number =
      Math.floor(
        Math.random() * 45
      ) + 1;

    if (
      !numbers.includes(number)
    ) {
      numbers.push(number);
    }
  }

  return numbers.sort(
    (a, b) => a - b
  );
};

// =========================================
// WEIGHTED NUMBER GENERATOR
// =========================================

const generateWeightedNumbers = async (
  count
) => {
  const frequency =
    await getScoreFrequency();

  const selected = [];

  /*
    Weighted selection:

    If a number appears more frequently
    in user scores, it receives a higher
    probability of being selected.

    +1 ensures every number still has
    a chance even if its frequency is 0.
  */

  while (
    selected.length < count
  ) {
    const candidates = [];

    for (
      let number = 1;
      number <= 45;
      number++
    ) {
      if (
        selected.includes(number)
      ) {
        continue;
      }

      const weight =
        Number(
          frequency[number] || 0
        ) + 1;

      candidates.push({
        number,
        weight,
      });
    }

    const totalWeight =
      candidates.reduce(
        (total, item) =>
          total + item.weight,
        0
      );

    let random =
      Math.random() *
      totalWeight;

    let selectedNumber = null;

    for (const candidate of candidates) {
      random -= candidate.weight;

      if (random <= 0) {
        selectedNumber =
          candidate.number;
        break;
      }
    }

    if (
      selectedNumber !== null &&
      !selected.includes(
        selectedNumber
      )
    ) {
      selected.push(
        selectedNumber
      );
    }
  }

  return selected.sort(
    (a, b) => a - b
  );
};

// =========================================
// SIMULATE DRAW
// =========================================

const simulateDraw = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Draw ID is required",
      });
    }

    // Get draw
    const drawList =
      await drawModel.getDraws();

    const draw =
      drawList.find(
        (item) => item.id === id
      );

    if (!draw) {
      return res.status(404).json({
        success: false,
        message: "Draw not found",
      });
    }

    // Do not simulate published draw
    if (
      draw.status === "published"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Published draw cannot be simulated",
      });
    }

    // Determine number count
    let numberCount;

    switch (draw.draw_type) {
      case "5-number":
        numberCount = 5;
        break;

      case "4-number":
        numberCount = 4;
        break;

      case "3-number":
        numberCount = 3;
        break;

      default:
        return res.status(400).json({
          success: false,
          message:
            "Invalid draw type",
        });
    }

    let numbers;

    // =====================================
    // RANDOM MODE
    // =====================================

    if (
      draw.draw_mode ===
      "random"
    ) {
      numbers =
        generateRandomNumbers(
          numberCount
        );
    }

    // =====================================
    // WEIGHTED MODE
    // =====================================

    else if (
      draw.draw_mode ===
      "weighted"
    ) {
      numbers =
        await generateWeightedNumbers(
          numberCount
        );
    }

    // =====================================
    // INVALID MODE
    // =====================================

    else {
      return res.status(400).json({
        success: false,
        message:
          "Invalid draw mode",
      });
    }

    // =====================================
    // UPDATE DRAW
    // =====================================

    const data =
      await drawModel.updateDraw(
        id,
        {
          winning_numbers:
            numbers,

          status: "simulated",
        }
      );

    return res.status(200).json({
      success: true,
      message:
        "Draw simulated successfully",
      data,
    });
  } catch (error) {
    console.error(
      "Simulate draw error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to simulate draw",
    });
  }
};

// =========================================
// PUBLISH DRAW
// =========================================

const publishDraw = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Draw ID is required",
      });
    }

    // Get draw
    const drawList =
      await drawModel.getDraws();

    const draw =
      drawList.find(
        (item) => item.id === id
      );

    if (!draw) {
      return res.status(404).json({
        success: false,
        message: "Draw not found",
      });
    }

    // Must be simulated first
    if (
      draw.status !== "simulated"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Draw must be simulated before publishing",
      });
    }

    // Must have winning numbers
    if (
      !Array.isArray(
        draw.winning_numbers
      ) ||
      draw.winning_numbers.length ===
        0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Winning numbers are required before publishing",
      });
    }

    const data =
      await drawModel.updateDraw(
        id,
        {
          status: "published",

          published_at:
            new Date().toISOString(),
        }
      );

    return res.status(200).json({
      success: true,
      message:
        "Draw published successfully",
      data,
    });
  } catch (error) {
    console.error(
      "Publish draw error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to publish draw",
    });
  }
};

// =========================================
// GET PUBLISHED DRAW
// =========================================

const getPublishedDraw = async (
  req,
  res
) => {
  try {
    const {
      data,
      error,
    } = await supabase
      .from("draws")
      .select("*")
      .eq(
        "status",
        "published"
      )
      .order(
        "draw_date",
        {
          ascending: false,
        }
      )
      .limit(1)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        message:
          "No published draw found",
      });
    }

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "Get published draw error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load published draw",
    });
  }
};

// =========================================
// EXPORTS
// =========================================

module.exports = {
  createDraw,
  getDraws,
  simulateDraw,
  publishDraw,
  getPublishedDraw,
};