const scoreModel = require("../models/scoreModel");

const addScore = async (req, res) => {
  try {
    const { score, scoreDate } = req.body;

    if (!score || !scoreDate) {
      return res.status(400).json({
        success: false,
        message: "Score and date are required",
      });
    }

    if (score < 1 || score > 45) {
      return res.status(400).json({
        success: false,
        message: "Score must be between 1 and 45",
      });
    }

    const data = await scoreModel.addScore(
      req.user.id,
      score,
      scoreDate
    );

    res.status(201).json({
      success: true,
      message: "Score added successfully",
      data,
    });
  } catch (error) {
    console.error("Add score error:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getScores = async (req, res) => {
  try {
    const data = await scoreModel.getLastFiveScores(req.user.id);

    res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateScore = async (req, res) => {
  try {
    const { score, scoreDate } = req.body;

    if (!score || !scoreDate) {
      return res.status(400).json({
        success: false,
        message: "Score and date are required",
      });
    }

    if (score < 1 || score > 45) {
      return res.status(400).json({
        success: false,
        message: "Score must be between 1 and 45",
      });
    }

    const data = await scoreModel.updateScore(
      req.params.id,
      req.user.id,
      score,
      scoreDate
    );

    res.json({
      success: true,
      message: "Score updated successfully",
      data,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteScore = async (req, res) => {
  try {
    await scoreModel.deleteScore(
      req.params.id,
      req.user.id
    );

    res.json({
      success: true,
      message: "Score deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  addScore,
  getScores,
  updateScore,
  deleteScore,
};