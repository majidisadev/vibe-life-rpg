import express from 'express';
import Character from '../models/Character.js';

const router = express.Router();

// Get all Characters
router.get('/', async (req, res) => {
  try {
    const { name, countryOrigin, japanPrefecture, media, characterType, page, limit } = req.query;
    const filter = {};
    
    if (name) filter.name = { $regex: name, $options: 'i' };
    if (countryOrigin) filter.countryOrigin = { $regex: countryOrigin, $options: 'i' };
    if (japanPrefecture) filter.japanPrefecture = { $regex: japanPrefecture, $options: 'i' };
    if (media) filter.media = media;
    if (characterType) filter.characterType = characterType;
    
    // Pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;
    
    // Get total count for pagination info
    const total = await Character.countDocuments(filter);
    
    // Get paginated data
    const characters = await Character.find(filter)
      .populate('media')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    
    res.json({
      data: characters,
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

// Get Character by ID
router.get('/:id', async (req, res) => {
  try {
    const character = await Character.findById(req.params.id).populate('media');
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }
    res.json(character);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create Character
router.post('/', async (req, res) => {
  try {
    const character = new Character(req.body);
    await character.save();
    res.status(201).json(character);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Character
router.put('/:id', async (req, res) => {
  try {
    const character = await Character.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }
    res.json(character);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Character
router.delete('/:id', async (req, res) => {
  try {
    const character = await Character.findByIdAndDelete(req.params.id);
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }
    res.json({ message: 'Character deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

