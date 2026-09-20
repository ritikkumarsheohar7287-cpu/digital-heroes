const express = require("express");
const { getCharities } = require("../controllers/charityController");

const router = express.Router();

router.get("/", getCharities);

module.exports = router;