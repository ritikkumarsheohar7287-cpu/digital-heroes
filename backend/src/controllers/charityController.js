const charityModel = require("../models/charityModel");

const getCharities = async (req, res) => {
  try {
    const charities = await charityModel.getAllCharities();

    res.status(200).json({
      success: true,
      count: charities.length,
      data: charities,
    });
  } catch (error) {
    console.error("Get charities error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch charities",
      error: error.message,
    });
  }
};

module.exports = {
  getCharities,
};