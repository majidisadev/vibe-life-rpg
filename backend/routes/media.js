import express from 'express';
import Media from '../models/Media.js';
import User from '../models/User.js';

const router = express.Router();

// Get all media
router.get('/', async (req, res) => {
  try {
    const { type, status, year, yearFrom, yearTo, title, description, externalSources, countryOrigin, page, limit } = req.query;
    const filter = {};
    
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (year) {
      filter.year = parseInt(year);
    } else {
      // Year range
      if (yearFrom || yearTo) {
        filter.year = {};
        if (yearFrom) filter.year.$gte = parseInt(yearFrom);
        if (yearTo) filter.year.$lte = parseInt(yearTo);
      }
    }
    if (title) filter.title = { $regex: title, $options: 'i' };
    if (description) filter.description = { $regex: description, $options: 'i' };
    if (externalSources) {
      filter.externalSources = { $regex: externalSources, $options: 'i' };
    }
    if (countryOrigin) {
      filter.countryOrigin = { $regex: countryOrigin, $options: 'i' };
    }
    
    // Pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;
    
    // Get total count for pagination info
    const total = await Media.countDocuments(filter);
    
    // Get paginated data
    const media = await Media.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    
    res.json({
      data: media,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching media:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export filtered media as JSON (must be before /:id route)
router.get('/export/json', async (req, res) => {
  try {
    const { type, status, year, yearFrom, yearTo, title, description, externalSources, countryOrigin } = req.query;
    const filter = {};
    
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (year) {
      filter.year = parseInt(year);
    } else {
      // Year range
      if (yearFrom || yearTo) {
        filter.year = {};
        if (yearFrom) filter.year.$gte = parseInt(yearFrom);
        if (yearTo) filter.year.$lte = parseInt(yearTo);
      }
    }
    if (title) filter.title = { $regex: title, $options: 'i' };
    if (description) filter.description = { $regex: description, $options: 'i' };
    if (externalSources) {
      filter.externalSources = { $regex: externalSources, $options: 'i' };
    }
    if (countryOrigin) {
      filter.countryOrigin = { $regex: countryOrigin, $options: 'i' };
    }
    
    const media = await Media.find(filter).select('year title description').sort({ year: 1, title: 1 });
    res.json(media);
  } catch (error) {
    console.error('Error exporting media:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get media by ID
router.get('/:id', async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }
    res.json(media);
  } catch (error) {
    console.error('Error fetching media by ID:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create media
router.post('/', async (req, res) => {
  try {
    const media = new Media(req.body);
    await media.save();
    res.status(201).json(media);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update media
router.put('/:id', async (req, res) => {
  try {
    const media = await Media.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }
    res.json(media);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add external source
router.post('/:id/sources', async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }
    
    const { url } = req.body;
    if (!media.externalSources.includes(url)) {
      media.externalSources.push(url);
      await media.save();
    }
    
    res.json(media);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Complete media
router.post('/:id/complete', async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }
    
    media.status = 'done';
    await media.save();
    
    // Give rewards
    const user = await User.findOne();
    if (user && media.reward) {
      if (media.reward.xp) user.addXP(media.reward.xp);
      if (media.reward.coins) user.coins += media.reward.coins;
      await user.save();
    }
    
    res.json(media);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Delete media
router.delete('/:id', async (req, res) => {
  try {
    const media = await Media.findByIdAndDelete(req.params.id);
    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }
    res.json({ message: 'Media deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

