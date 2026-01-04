import express from "express";
import User from "../models/User.js";

const router = express.Router();

// Default exchange rates (can be customized)
const DEFAULT_RATES = {
  meat: 1, // 1 meat = 1 coin
  wood: 2, // 1 wood = 2 coins
  stone: 3, // 1 stone = 3 coins
  iron: 5, // 1 iron = 5 coins
  crystal: 10, // 1 crystal = 10 coins
};

// Get exchange rates
router.get("/rates", async (req, res) => {
  try {
    const user = await User.findOne();
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get rates from user settings or use default
    const rates =
      user.settings?.marketRates || DEFAULT_RATES;
    res.json(rates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update exchange rates
router.put("/rates", async (req, res) => {
  try {
    const user = await User.findOne();
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.settings) {
      user.settings = {};
    }

    user.settings.marketRates = {
      ...DEFAULT_RATES,
      ...req.body,
    };

    await user.save();
    res.json(user.settings.marketRates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Exchange resource to coins
router.post("/exchange", async (req, res) => {
  try {
    const user = await User.findOne();
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { resource, amount } = req.body;

    if (!resource || !amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid resource or amount" });
    }

    const validResources = ["meat", "wood", "stone", "iron", "crystal"];
    if (!validResources.includes(resource)) {
      return res.status(400).json({ error: "Invalid resource type" });
    }

    // Check if user has enough resources
    if (user.resources[resource] < amount) {
      return res.status(400).json({ error: "Not enough resources" });
    }

    // Get exchange rate
    const rates = user.settings?.marketRates || DEFAULT_RATES;
    const rate = rates[resource] || 1;

    // Calculate coins
    const coins = amount * rate;

    // Deduct resources and add coins
    user.resources[resource] -= amount;
    user.coins += coins;

    await user.save();

    res.json({
      success: true,
      resource,
      amount,
      coins,
      user,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

