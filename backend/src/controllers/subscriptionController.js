const subscriptionModel = require("../models/subscriptionModel");

const PLAN_PRICES = {
  monthly: 10,
  yearly: 100,
};

const createSubscription = async (req, res) => {
  try {
    const { plan, charityPercentage } = req.body;

    if (!plan) {
      return res.status(400).json({
        success: false,
        message: "Subscription plan is required",
      });
    }

    if (!["monthly", "yearly"].includes(plan)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription plan",
      });
    }

    const amount = PLAN_PRICES[plan];

    const percentage = Number(charityPercentage || 10);

    if (percentage < 10 || percentage > 100) {
      return res.status(400).json({
        success: false,
        message:
          "Charity percentage must be between 10 and 100",
      });
    }

    const existing =
      await subscriptionModel.getUserSubscription(
        req.user.id
      );

    if (
      existing &&
      existing.status === "active"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "You already have an active subscription.",
      });
    }

    const data =
      await subscriptionModel.createSubscription(
        req.user.id,
        plan,
        amount,
        percentage
      );

    res.status(201).json({
      success: true,
      message:
        "Subscription created successfully",
      data,
    });
  } catch (error) {
    console.error(
      "Subscription error:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getSubscription = async (req, res) => {
  try {
    const data =
      await subscriptionModel.getUserSubscription(
        req.user.id
      );

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "Get subscription error:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const cancelSubscription = async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({
        success: false,
        message:
          "Subscription ID is required",
      });
    }

    const data =
      await subscriptionModel.cancelSubscription(
        req.params.id,
        req.user.id
      );

    res.json({
      success: true,
      message:
        "Subscription canceled successfully",
      data,
    });
  } catch (error) {
    console.error(
      "Cancel subscription error:",
      error
    );

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createSubscription,
  getSubscription,
  cancelSubscription,
};