const testDatabase = require("../services/dbTest");

const testDB = async (req, res) => {
  try {
    const data = await testDatabase();

    res.json({
      success: true,
      message: "PostgreSQL database connected successfully 🚀",
      data,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
};

module.exports = {
  testDB,
};