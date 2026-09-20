const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");

const {
  createSubscription,
  getSubscription,
  cancelSubscription,
} = require("../controllers/subscriptionController");

const router = express.Router();

router.use(authMiddleware);

router.post("/", createSubscription);

router.get("/", getSubscription);

router.put("/:id/cancel", cancelSubscription);

module.exports = router;