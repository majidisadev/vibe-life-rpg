import express from "express";
import mongoose from "mongoose";
import Journal from "../models/Journal.js";

const router = express.Router();

// Get journal entries (paginated, filter by hashtag, location, character, search, date range)
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 20, hashtag, locationRefId, characterId, search, dateFrom, dateTo } = req.query;
    const filter = {};
    if (hashtag) {
      filter.hashtags = { $in: [hashtag] };
    }
    if (locationRefId && mongoose.Types.ObjectId.isValid(locationRefId)) {
      filter["locationTag.refId"] = new mongoose.Types.ObjectId(locationRefId);
    }
    if (characterId && mongoose.Types.ObjectId.isValid(characterId)) {
      filter.characterTags = { $in: [new mongoose.Types.ObjectId(characterId)] };
    }
    if (search && search.trim()) {
      filter.content = { $regex: search.trim(), $options: "i" };
    }
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) {
        filter.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDate;
      }
    }
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const total = await Journal.countDocuments(filter);
    const entries = await Journal.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      data: entries,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get distinct hashtags (for filter chips)
router.get("/hashtags", async (req, res) => {
  try {
    const tags = await Journal.distinct("hashtags");
    res.json(tags.filter(Boolean).sort());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get gallery images (filter by date, location, character; paginated for infinite scroll)
router.get("/gallery", async (req, res) => {
  try {
    const { page = 1, limit = 24, dateFrom, dateTo, locationRefId, characterIds } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter = { images: { $exists: true, $ne: [] } };
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDate;
      }
    }
    if (locationRefId && mongoose.Types.ObjectId.isValid(locationRefId)) {
      filter["locationTag.refId"] = new mongoose.Types.ObjectId(locationRefId);
    }
    if (characterIds) {
      const ids = (Array.isArray(characterIds) ? characterIds : characterIds.split(","))
        .map((id) => id.trim())
        .filter((id) => mongoose.Types.ObjectId.isValid(id));
      if (ids.length > 0) {
        filter.characterTags = { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) };
      }
    }

    const entries = await Journal.find(filter)
      .sort({ createdAt: -1 })
      .select("images createdAt");

    const allImages = [];
    entries.forEach((e) => {
      (e.images || []).forEach((img, idx) => {
        allImages.push({
          src: img,
          journalId: e._id,
          createdAt: e.createdAt,
          index: idx,
        });
      });
    });

    const total = allImages.length;
    const paginated = allImages.slice(skip, skip + limitNum);

    res.json({
      data: paginated,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single journal entry (for gallery preview sidebar)
router.get("/:id", async (req, res) => {
  try {
    const journal = await Journal.findById(req.params.id);
    if (!journal) {
      return res.status(404).json({ error: "Journal entry not found" });
    }
    res.json(journal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create journal entry
router.post("/", async (req, res) => {
  try {
    const { content, images, locationTag, characterTags } = req.body;

    const hashtags = [];
    if (content && typeof content === "string") {
      const matches = content.match(/#(\w+)/g);
      if (matches) {
        matches.forEach((m) => {
          const tag = m.slice(1).toLowerCase();
          if (tag && !hashtags.includes(tag)) hashtags.push(tag);
        });
      }
    }

    const journal = new Journal({
      content: content || "",
      images: Array.isArray(images) ? images : [],
      locationTag: locationTag || { locType: null, refId: null },
      characterTags: Array.isArray(characterTags) ? characterTags : [],
      hashtags,
    });
    await journal.save();
    res.status(201).json(journal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update journal entry
router.put("/:id", async (req, res) => {
  try {
    const journal = await Journal.findById(req.params.id);
    if (!journal) {
      return res.status(404).json({ error: "Journal entry not found" });
    }

    const { content, images, locationTag, characterTags } = req.body;

    if (content !== undefined) journal.content = content;
    if (Array.isArray(images)) journal.images = images;
    if (locationTag !== undefined) journal.locationTag = locationTag || { locType: null, refId: null };
    if (Array.isArray(characterTags)) journal.characterTags = characterTags;

    const hashtags = [];
    if (journal.content) {
      const matches = journal.content.match(/#(\w+)/g);
      if (matches) {
        matches.forEach((m) => {
          const tag = m.slice(1).toLowerCase();
          if (tag && !hashtags.includes(tag)) hashtags.push(tag);
        });
      }
    }
    journal.hashtags = hashtags;

    await journal.save();
    res.json(journal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete journal entry
router.delete("/:id", async (req, res) => {
  try {
    const journal = await Journal.findByIdAndDelete(req.params.id);
    if (!journal) {
      return res.status(404).json({ error: "Journal entry not found" });
    }
    res.json({ message: "Journal entry deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
