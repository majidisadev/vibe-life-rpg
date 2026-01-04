import express from "express";
import Weapon from "../models/Weapon.js";
import User from "../models/User.js";

const router = express.Router();

// Get all weapons
router.get("/", async (req, res) => {
  try {
    const { unlocked } = req.query;
    const filter = {};
    if (unlocked !== undefined) {
      filter.unlocked = unlocked === "true";
    }
    const weapons = await Weapon.find(filter).sort({ createdAt: -1 });
    res.json(weapons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get weapon by ID
router.get("/:id", async (req, res) => {
  try {
    const weapon = await Weapon.findById(req.params.id);
    if (!weapon) {
      return res.status(404).json({ error: "Weapon not found" });
    }
    res.json(weapon);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create weapon
router.post("/", async (req, res) => {
  try {
    const weapon = new Weapon(req.body);
    await weapon.save();
    res.status(201).json(weapon);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update weapon
router.put("/:id", async (req, res) => {
  try {
    const weapon = await Weapon.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!weapon) {
      return res.status(404).json({ error: "Weapon not found" });
    }
    res.json(weapon);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete weapon
router.delete("/:id", async (req, res) => {
  try {
    const weapon = await Weapon.findByIdAndDelete(req.params.id);
    if (!weapon) {
      return res.status(404).json({ error: "Weapon not found" });
    }
    res.json({ message: "Weapon deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Craft weapon
router.post("/:id/craft", async (req, res) => {
  try {
    const user = await User.findOne();
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const weapon = await Weapon.findById(req.params.id);
    if (!weapon) {
      return res.status(404).json({ error: "Weapon not found" });
    }

    if (!weapon.unlocked) {
      return res.status(400).json({ error: "Weapon not unlocked" });
    }

    // Check if user already has this weapon (simplified: check if user has enough resources)
    // In a real game, you'd track owned weapons separately

    // Check resources
    if (user.coins < weapon.cost.coins) {
      return res.status(400).json({ error: "Not enough coins" });
    }

    if (
      user.resources.meat < weapon.cost.resources.meat ||
      user.resources.wood < weapon.cost.resources.wood ||
      user.resources.stone < weapon.cost.resources.stone ||
      user.resources.iron < weapon.cost.resources.iron ||
      user.resources.crystal < weapon.cost.resources.crystal
    ) {
      return res.status(400).json({ error: "Not enough resources" });
    }

    // Deduct costs
    user.coins -= weapon.cost.coins;
    user.resources.meat -= weapon.cost.resources.meat;
    user.resources.wood -= weapon.cost.resources.wood;
    user.resources.stone -= weapon.cost.resources.stone;
    user.resources.iron -= weapon.cost.resources.iron;
    user.resources.crystal -= weapon.cost.resources.crystal;

    await user.save();

    res.json({
      success: true,
      weapon,
      user,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Equip/Unequip weapon (toggles)
router.post("/:id/equip", async (req, res) => {
  try {
    const user = await User.findOne();
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const weapon = await Weapon.findById(req.params.id);
    if (!weapon) {
      return res.status(404).json({ error: "Weapon not found" });
    }

    // Toggle equip/unequip
    if (user.equippedWeapon && user.equippedWeapon.toString() === weapon._id.toString()) {
      // Already equipped, so unequip
      user.equippedWeapon = null;
    } else {
      // Not equipped, so equip
      user.equippedWeapon = weapon._id;
    }
    
    await user.save();

    res.json({
      success: true,
      weapon,
      user,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

