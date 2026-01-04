import express from 'express';
import Health from '../models/Health.js';
import User from '../models/User.js';

const router = express.Router();

// Get all health entries
router.get('/', async (req, res) => {
  try {
    const health = await Health.find().sort({ date: -1 });
    res.json(health);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get health by ID
router.get('/:id', async (req, res) => {
  try {
    const health = await Health.findById(req.params.id);
    if (!health) {
      return res.status(404).json({ error: 'Health entry not found' });
    }
    res.json(health);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create health entry
router.post('/', async (req, res) => {
  try {
    // Validate sleep value (must be integer 1-12)
    if (req.body.type === 'sleep' && req.body.value !== undefined) {
      const sleepValue = parseFloat(req.body.value);
      if (isNaN(sleepValue) || sleepValue < 1 || sleepValue > 12) {
        return res.status(400).json({ error: 'Jam tidur harus antara 1-12 jam (bilangan bulat)' });
      }
      // Ensure value is integer (no decimals)
      const intValue = Math.floor(sleepValue);
      if (intValue !== sleepValue) {
        return res.status(400).json({ error: 'Jam tidur harus bilangan bulat (tidak boleh decimal)' });
      }
      // Ensure value is between 1-12
      if (intValue < 1 || intValue > 12) {
        return res.status(400).json({ error: 'Jam tidur harus antara 1-12 jam' });
      }
      // Set validated integer value
      req.body.value = intValue;
    }
    
    const health = new Health(req.body);
    await health.save();
    
    let energyAdded = 0;
    
    // If it's sleep, check if this is the first sleep entry for this date
    if (health.type === 'sleep' && health.value) {
      const user = await User.findOne();
      if (user) {
        // Check if there's already a sleep entry for this date
        const sleepDate = new Date(health.date);
        sleepDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(sleepDate);
        nextDay.setDate(nextDay.getDate() + 1);
        
        const existingSleep = await Health.findOne({
          type: 'sleep',
          date: {
            $gte: sleepDate,
            $lt: nextDay
          },
          _id: { $ne: health._id }
        });
        
        // Only add energy if this is the first sleep entry for this date
        if (!existingSleep) {
          const energyBefore = user.energy;
          // health.value is already validated as integer 1-12
          user.addEnergyFromSleep(health.value);
          await user.save();
          energyAdded = user.energy - energyBefore;
        }
      }
    }
    
    res.status(201).json({ ...health.toObject(), energyAdded });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update health entry
router.put('/:id', async (req, res) => {
  try {
    // Validate sleep value (must be integer 1-12)
    if (req.body.type === 'sleep' && req.body.value !== undefined) {
      const sleepValue = parseFloat(req.body.value);
      if (isNaN(sleepValue) || sleepValue < 1 || sleepValue > 12) {
        return res.status(400).json({ error: 'Jam tidur harus antara 1-12 jam (bilangan bulat)' });
      }
      // Ensure value is integer (no decimals)
      const intValue = Math.floor(sleepValue);
      if (intValue !== sleepValue) {
        return res.status(400).json({ error: 'Jam tidur harus bilangan bulat (tidak boleh decimal)' });
      }
      // Ensure value is between 1-12
      if (intValue < 1 || intValue > 12) {
        return res.status(400).json({ error: 'Jam tidur harus antara 1-12 jam' });
      }
      // Set validated integer value
      req.body.value = intValue;
    }
    
    const health = await Health.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!health) {
      return res.status(404).json({ error: 'Health entry not found' });
    }
    res.json(health);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete health entry
router.delete('/:id', async (req, res) => {
  try {
    const health = await Health.findByIdAndDelete(req.params.id);
    if (!health) {
      return res.status(404).json({ error: 'Health entry not found' });
    }
    res.json({ message: 'Health entry deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

