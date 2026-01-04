import express from "express";
import Album from "../models/Album.js";
import User from "../models/User.js";
import Building from "../models/Building.js";

const router = express.Router();

// Get all album photos
router.get("/", async (req, res) => {
  try {
    const { tags, characters, location, page, limit } = req.query;
    const filter = {};

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filter.tags = { $in: tagArray };
    }

    if (characters) {
      const characterArray = Array.isArray(characters)
        ? characters
        : [characters];
      filter.characters = { $in: characterArray };
    }

    if (location) {
      filter.location = location;
    }

    // Pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;
    
    // Get total count for pagination info
    const total = await Album.countDocuments(filter);
    
    // Get paginated data
    const photos = await Album.find(filter)
      .populate("characters")
      .populate("location")
      .sort({ uploadedAt: -1 })
      .skip(skip)
      .limit(limitNum);
    
    res.json({
      data: photos,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get photo by ID
router.get("/:id", async (req, res) => {
  try {
    const photo = await Album.findById(req.params.id)
      .populate("characters")
      .populate("location");
    if (!photo) {
      return res.status(404).json({ error: "Photo not found" });
    }
    res.json(photo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload photo (consume 1 energy)
router.post("/", async (req, res) => {
  try {
    const user = await User.findOne();
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.energy < 1) {
      return res.status(400).json({ error: "Not enough energy" });
    }

    const { title, image, tags, characters, location } = req.body;

    if (!image) {
      return res.status(400).json({ error: "Image is required" });
    }

    // Validate characters (must be from activeCharacters)
    if (characters && Array.isArray(characters) && characters.length > 0) {
      // Convert to string IDs for comparison
      const characterIds = characters.map((char) => 
        typeof char === 'object' && char._id ? char._id.toString() : char.toString()
      );
      const activeCharacterIds = (user.activeCharacters || []).map((id) => id.toString());
      const invalidCharacters = characterIds.filter(
        (charId) => !activeCharacterIds.includes(charId)
      );
      if (invalidCharacters.length > 0) {
        return res.status(400).json({
          error: "Characters must be from active characters",
        });
      }
    }

    // Validate location (must be built lewd_location)
    if (location && location !== "" && location !== "none") {
      const building = await Building.findById(location);
      if (
        !building ||
        building.type !== "lewd_location" ||
        !building.built
      ) {
        return res.status(400).json({
          error: "Location must be a built lewd location",
        });
      }
    }

    // Create photo
    const photo = new Album({
      title: title || "",
      image,
      tags: tags || [],
      characters: characters || [],
      location: (location && location !== "" && location !== "none") ? location : null,
      uploadedAt: new Date(),
    });

    // Consume energy
    user.energy -= 1;

    await photo.save();
    await user.save();

    const savedPhoto = await Album.findById(photo._id)
      .populate("characters")
      .populate("location");

    res.status(201).json(savedPhoto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update photo
router.put("/:id", async (req, res) => {
  try {
    const user = await User.findOne();
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { title, tags, characters, location } = req.body;

    const photo = await Album.findById(req.params.id);
    if (!photo) {
      return res.status(404).json({ error: "Photo not found" });
    }

    // Validate characters (must be from activeCharacters)
    if (characters && Array.isArray(characters) && characters.length > 0) {
      // Convert to string IDs for comparison
      const characterIds = characters.map((char) => 
        typeof char === 'object' && char._id ? char._id.toString() : char.toString()
      );
      const activeCharacterIds = (user.activeCharacters || []).map((id) => id.toString());
      const invalidCharacters = characterIds.filter(
        (charId) => !activeCharacterIds.includes(charId)
      );
      if (invalidCharacters.length > 0) {
        return res.status(400).json({
          error: "Characters must be from active characters",
        });
      }
    }

    // Validate location (must be built lewd_location)
    if (location && location !== "" && location !== "none") {
      const building = await Building.findById(location);
      if (
        !building ||
        building.type !== "lewd_location" ||
        !building.built
      ) {
        return res.status(400).json({
          error: "Location must be a built lewd location",
        });
      }
    }

    if (title !== undefined) photo.title = title;
    if (tags !== undefined) photo.tags = tags;
    if (characters !== undefined) {
      // Normalize characters to array of IDs
      if (Array.isArray(characters)) {
        photo.characters = characters.map((char) => 
          typeof char === 'object' && char._id ? char._id : char
        );
      } else {
        photo.characters = [];
      }
    }
    if (location !== undefined) {
      // Set to null if empty string or "none"
      photo.location = (location === "" || location === "none") ? null : location;
    }

    await photo.save();

    const updatedPhoto = await Album.findById(photo._id)
      .populate("characters")
      .populate("location");

    res.json(updatedPhoto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete photo
router.delete("/:id", async (req, res) => {
  try {
    const photo = await Album.findByIdAndDelete(req.params.id);
    if (!photo) {
      return res.status(404).json({ error: "Photo not found" });
    }
    res.json({ message: "Photo deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

