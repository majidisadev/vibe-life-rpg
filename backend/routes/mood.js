import express from 'express';
import Mood from '../models/Mood.js';

const router = express.Router();

// Get all mood entries
router.get('/', async (req, res) => {
  try {
    const moods = await Mood.find().sort({ date: -1 });
    res.json(moods);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get mood by ID
router.get('/:id', async (req, res) => {
  try {
    const mood = await Mood.findById(req.params.id);
    if (!mood) {
      return res.status(404).json({ error: 'Mood not found' });
    }
    res.json(mood);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create mood entry
router.post('/', async (req, res) => {
  try {
    const mood = new Mood(req.body);
    await mood.save();
    res.status(201).json(mood);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update mood entry
router.put('/:id', async (req, res) => {
  try {
    const mood = await Mood.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!mood) {
      return res.status(404).json({ error: 'Mood not found' });
    }
    res.json(mood);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete mood entry
router.delete('/:id', async (req, res) => {
  try {
    const mood = await Mood.findByIdAndDelete(req.params.id);
    if (!mood) {
      return res.status(404).json({ error: 'Mood not found' });
    }
    res.json({ message: 'Mood entry deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

