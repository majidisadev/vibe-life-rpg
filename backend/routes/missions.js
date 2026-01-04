import express from 'express';
import Mission from '../models/Mission.js';
import User from '../models/User.js';

const router = express.Router();

// Get all missions
router.get('/', async (req, res) => {
  try {
    const missions = await Mission.find().sort({ order: 1, createdAt: -1 });
    res.json(missions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get mission by ID
router.get('/:id', async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.id);
    if (!mission) {
      return res.status(404).json({ error: 'Mission not found' });
    }
    res.json(mission);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create mission
router.post('/', async (req, res) => {
  try {
    // Convert checklist from old format (array of strings) to new format (array of objects)
    if (req.body.checklist && Array.isArray(req.body.checklist)) {
      req.body.checklist = req.body.checklist.map((item) => {
        if (typeof item === 'string') {
          return { text: item, checked: false };
        }
        return item;
      });
    }
    // Set order to last if not provided
    if (req.body.order === undefined) {
      const maxOrderMission = await Mission.findOne().sort({ order: -1 });
      req.body.order = maxOrderMission ? maxOrderMission.order + 1 : 0;
    }
    const mission = new Mission(req.body);
    await mission.save();
    res.status(201).json(mission);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update mission
router.put('/:id', async (req, res) => {
  try {
    // Convert checklist from old format (array of strings) to new format (array of objects)
    if (req.body.checklist && Array.isArray(req.body.checklist)) {
      req.body.checklist = req.body.checklist.map((item) => {
        if (typeof item === 'string') {
          return { text: item, checked: false };
        }
        return item;
      });
    }
    const mission = await Mission.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!mission) {
      return res.status(404).json({ error: 'Mission not found' });
    }
    res.json(mission);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Complete mission
router.post('/:id/complete', async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.id);
    if (!mission) {
      return res.status(404).json({ error: 'Mission not found' });
    }
    
    if (mission.completed) {
      return res.status(400).json({ error: 'Mission already completed' });
    }
    
    mission.completed = true;
    mission.completedDate = new Date();
    await mission.save();
    
    // Give rewards
    const user = await User.findOne();
    if (user) {
      const difficulty = user.settings.difficulty[mission.difficulty];
      user.addXP(difficulty.reward.xp);
      user.coins += difficulty.reward.coins;
      await user.save();
    }
    
    res.json(mission);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle checklist item
router.post('/:id/checklist/:index/toggle', async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.id);
    if (!mission) {
      return res.status(404).json({ error: 'Mission not found' });
    }

    const index = parseInt(req.params.index);
    if (index < 0 || index >= mission.checklist.length) {
      return res.status(400).json({ error: 'Invalid checklist index' });
    }

    // Handle both old (string) and new (object) format
    if (typeof mission.checklist[index] === 'string') {
      // Convert string to object format
      mission.checklist[index] = { text: mission.checklist[index], checked: true };
    } else if (mission.checklist[index] && typeof mission.checklist[index] === 'object') {
      // Ensure object has text property
      if (!mission.checklist[index].text) {
        mission.checklist[index].text = mission.checklist[index].toString() || '';
      }
      // Toggle the checked status - always toggle regardless of current state
      const currentChecked = mission.checklist[index].checked === true;
      mission.checklist[index].checked = !currentChecked;
    } else {
      // Fallback: convert to object
      mission.checklist[index] = { text: String(mission.checklist[index]), checked: true };
    }
    
    // Mark the checklist array as modified
    mission.markModified('checklist');
    await mission.save();

    res.json(mission);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reorder missions
router.post('/reorder', async (req, res) => {
  try {
    const { missionIds } = req.body; // Array of mission IDs in new order
    if (!Array.isArray(missionIds)) {
      return res.status(400).json({ error: 'missionIds must be an array' });
    }

    // Update order for each mission
    const updatePromises = missionIds.map((id, index) =>
      Mission.findByIdAndUpdate(id, { order: index }, { new: true })
    );

    await Promise.all(updatePromises);
    res.json({ message: 'Missions reordered' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Move mission to top
router.post('/:id/move-to-top', async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.id);
    if (!mission) {
      return res.status(404).json({ error: 'Mission not found' });
    }

    // Get minimum order
    const minOrderMission = await Mission.findOne().sort({ order: 1 });
    const minOrder = minOrderMission ? minOrderMission.order : 0;

    // Set this mission's order to minOrder - 1
    mission.order = minOrder - 1;
    await mission.save();

    res.json(mission);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Move mission to bottom
router.post('/:id/move-to-bottom', async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.id);
    if (!mission) {
      return res.status(404).json({ error: 'Mission not found' });
    }

    // Get maximum order
    const maxOrderMission = await Mission.findOne().sort({ order: -1 });
    const maxOrder = maxOrderMission ? maxOrderMission.order : 0;

    // Set this mission's order to maxOrder + 1
    mission.order = maxOrder + 1;
    await mission.save();

    res.json(mission);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete mission
router.delete('/:id', async (req, res) => {
  try {
    const mission = await Mission.findByIdAndDelete(req.params.id);
    if (!mission) {
      return res.status(404).json({ error: 'Mission not found' });
    }
    res.json({ message: 'Mission deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

