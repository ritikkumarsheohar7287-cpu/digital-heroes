const drawEntryModel = require("../models/drawEntryModel");
const drawModel = require("../models/drawModel");
const supabase = require("../config/supabase");

const createEntry = async (req, res) => {
  try {
    const { drawId, selectedNumbers } = req.body;

    // Basic validation
    if (!drawId || !selectedNumbers) {
      return res.status(400).json({
        success: false,
        message: "Draw ID and selected numbers are required",
      });
    }

    // Check active subscription
    const { data: subscription, error: subscriptionError } =
      await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", req.user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (subscriptionError) {
      console.error(
        "Subscription check error:",
        subscriptionError
      );

      return res.status(500).json({
        success: false,
        message: "Unable to verify subscription",
      });
    }

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message:
          "An active subscription is required to enter the monthly draw.",
      });
    }

    // Get draw
    const draws = await drawModel.getDraws();

    const draw = draws.find(
      (item) => item.id === drawId
    );

    if (!draw) {
      return res.status(404).json({
        success: false,
        message: "Draw not found",
      });
    }

    // Only published draws
    if (draw.status !== "published") {
      return res.status(400).json({
        success: false,
        message:
          "Entries are allowed only for published draws",
      });
    }

    // Required number count
    const requiredCount =
      draw.draw_type === "5-number"
        ? 5
        : draw.draw_type === "4-number"
        ? 4
        : 3;

    // Check number count
    if (selectedNumbers.length !== requiredCount) {
      return res.status(400).json({
        success: false,
        message: `Select exactly ${requiredCount} numbers`,
      });
    }

    // Check duplicate numbers
    const uniqueNumbers = [
      ...new Set(selectedNumbers),
    ];

    if (uniqueNumbers.length !== requiredCount) {
      return res.status(400).json({
        success: false,
        message: "Numbers cannot be duplicated",
      });
    }

    // Check number range
    if (
      selectedNumbers.some(
        (number) =>
          !Number.isInteger(number) ||
          number < 1 ||
          number > 45
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Numbers must be between 1 and 45",
      });
    }

    // Create entry
    const sortedNumbers = [...selectedNumbers].sort(
      (a, b) => a - b
    );

    const data = await drawEntryModel.createEntry(
      drawId,
      req.user.id,
      sortedNumbers
    );

    res.status(201).json({
      success: true,
      message: "Draw entry created successfully",
      data,
    });
  } catch (error) {
    console.error("Create entry error:", error);

    // Duplicate entry
    if (
      error.code === "23505" ||
      error.message?.includes(
        "draw_entries_draw_id_user_id_key"
      )
    ) {
      return res.status(409).json({
        success: false,
        message:
          "You have already submitted an entry for this draw.",
      });
    }

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getEntries = async (req, res) => {
  try {
    const data =
      await drawEntryModel.getEntriesByDraw(
        req.params.drawId
      );

    res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Get entries error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createEntry,
  getEntries,
};