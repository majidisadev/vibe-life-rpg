import express from "express";
import Character from "../models/Character.js";
import User from "../models/User.js";
import Media from "../models/Media.js";

const router = express.Router();

// Get gacha pool (available characters for gacha)
router.get("/pool", async (req, res) => {
  try {
    const user = await User.findOne();
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get all supporting characters from media with status 'done'
    const doneMedia = await Media.find({ status: "done" });
    const doneMediaIds = doneMedia.map((m) => m._id);

    // Get supporting characters from done media that haven't been collected
    const availableCharacters = await Character.find({
      characterType: "supporting_character",
      media: { $in: doneMediaIds },
      _id: { $nin: user.collectedCharacters },
    }).populate("media");

    res.json(availableCharacters);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Gacha pull
router.post("/pull", async (req, res) => {
  try {
    const user = await User.findOne();
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.energy < 1) {
      return res.status(400).json({ error: "Not enough energy" });
    }

    // Get available characters for gacha
    const doneMedia = await Media.find({ status: "done" });
    const doneMediaIds = doneMedia.map((m) => m._id);

    const availableCharacters = await Character.find({
      characterType: "supporting_character",
      media: { $in: doneMediaIds },
      _id: { $nin: user.collectedCharacters },
    }).populate("media");

    if (availableCharacters.length === 0) {
      return res.status(400).json({ error: "No characters available for gacha" });
    }

    // Equal distribution rate (random selection)
    const randomIndex = Math.floor(Math.random() * availableCharacters.length);
    const pulledCharacter = availableCharacters[randomIndex];

    // Consume energy
    user.energy -= 1;

    // Add to collected characters
    if (!user.collectedCharacters.includes(pulledCharacter._id)) {
      user.collectedCharacters.push(pulledCharacter._id);
    }

    await user.save();

    res.json({
      success: true,
      character: pulledCharacter,
      user,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

