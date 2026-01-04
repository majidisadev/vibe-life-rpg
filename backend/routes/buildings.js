import express from "express";
import Building from "../models/Building.js";
import User from "../models/User.js";

const router = express.Router();

// Get all buildings
router.get("/", async (req, res) => {
  try {
    const buildings = await Building.find().sort({ createdAt: -1 });
    res.json(buildings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get building by ID
router.get("/:id", async (req, res) => {
  try {
    const building = await Building.findById(req.params.id);
    if (!building) {
      return res.status(404).json({ error: "Building not found" });
    }
    res.json(building);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create building
router.post("/", async (req, res) => {
  try {
    const building = new Building(req.body);
    await building.save();
    res.status(201).json(building);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update building
router.put("/:id", async (req, res) => {
  try {
    const building = await Building.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!building) {
      return res.status(404).json({ error: "Building not found" });
    }
    res.json(building);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete building (lewd_location or houses that haven't started building)
router.delete("/:id", async (req, res) => {
  try {
    const building = await Building.findById(req.params.id);
    if (!building) {
      return res.status(404).json({ error: "Building not found" });
    }

    // Allow deletion if:
    // 1. Building is deletable (lewd_location), OR
    // 2. Building is a house that hasn't been built yet
    const canDelete =
      building.deletable ||
      (building.type === "house" && !building.built);

    if (!canDelete) {
      return res
        .status(400)
        .json({ error: "This building cannot be deleted" });
    }

    await Building.findByIdAndDelete(req.params.id);
    res.json({ message: "Building deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start building (allocate build power)
router.post("/:id/start-build", async (req, res) => {
  try {
    const user = await User.findOne();
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const building = await Building.findById(req.params.id);
    if (!building) {
      return res.status(404).json({ error: "Building not found" });
    }

    if (building.built) {
      return res.status(400).json({ error: "Building already built" });
    }

    // If buildPowerRequired is 0, building can be built immediately without build power
    if (building.buildPowerRequired === 0) {
      // Check resources
      if (
        user.resources.meat < building.resourcesRequired.meat ||
        user.resources.wood < building.resourcesRequired.wood ||
        user.resources.stone < building.resourcesRequired.stone ||
        user.resources.iron < building.resourcesRequired.iron ||
        user.resources.crystal < building.resourcesRequired.crystal
      ) {
        return res.status(400).json({ error: "Not enough resources" });
      }

      // Building is complete immediately
      building.built = true;

      // Deduct resources
      user.resources.meat -= building.resourcesRequired.meat;
      user.resources.wood -= building.resourcesRequired.wood;
      user.resources.stone -= building.resourcesRequired.stone;
      user.resources.iron -= building.resourcesRequired.iron;
      user.resources.crystal -= building.resourcesRequired.crystal;

      // Apply building effects
      if (building.type === "house") {
        // Increase max population based on bonusPopulation from building
        const bonus = building.bonusPopulation || 5; // default 5 for backward compatibility
        user.maxPopulation += bonus;
      } else if (building.type === "blacksmith") {
        // Unlock weapons (handled separately when creating weapons)
      }
    } else {
      // Check if user has enough build power to complete the building
      if (user.buildPower < building.buildPowerRequired) {
        return res.status(400).json({ 
          error: `Not enough build power (need ${building.buildPowerRequired}, have ${user.buildPower})` 
        });
      }

      // Check resources
      if (
        user.resources.meat < building.resourcesRequired.meat ||
        user.resources.wood < building.resourcesRequired.wood ||
        user.resources.stone < building.resourcesRequired.stone ||
        user.resources.iron < building.resourcesRequired.iron ||
        user.resources.crystal < building.resourcesRequired.crystal
      ) {
        return res.status(400).json({ error: "Not enough resources" });
      }

      // Deduct build power from user
      user.buildPower -= building.buildPowerRequired;

      // Building is complete immediately
      building.built = true;

      // Deduct resources
      user.resources.meat -= building.resourcesRequired.meat;
      user.resources.wood -= building.resourcesRequired.wood;
      user.resources.stone -= building.resourcesRequired.stone;
      user.resources.iron -= building.resourcesRequired.iron;
      user.resources.crystal -= building.resourcesRequired.crystal;

      // Apply building effects
      if (building.type === "house") {
        // Increase max population based on bonusPopulation from building
        const bonus = building.bonusPopulation || 5; // default 5 for backward compatibility
        user.maxPopulation += bonus;
      } else if (building.type === "blacksmith") {
        // Unlock weapons (handled separately when creating weapons)
      }
    }

    await building.save();
    await user.save();

    res.json({
      success: true,
      building,
      user,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

