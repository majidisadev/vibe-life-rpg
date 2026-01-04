import express from 'express';
import Habit from '../models/Habit.js';
import User from '../models/User.js';

const router = express.Router();

// Helper function to check if a habit should be reset
const shouldResetHabit = (habit, today) => {
  // If no lastReset, don't reset (it's a new habit)
  if (!habit.lastReset) {
    return false;
  }
  
  const lastReset = new Date(habit.lastReset);
  lastReset.setHours(0, 0, 0, 0);
  
  if (habit.resetCounter === 'daily') {
    // Reset if last reset was before today
    return lastReset.getTime() < today.getTime();
  }
  
  if (habit.resetCounter === 'weekly') {
    // Reset if last reset was more than 7 days ago
    const daysDiff = Math.floor((today - lastReset) / (1000 * 60 * 60 * 24));
    return daysDiff >= 7;
  }
  
  if (habit.resetCounter === 'monthly') {
    // Reset if last reset was in a different month
    return lastReset.getMonth() !== today.getMonth() || 
           lastReset.getFullYear() !== today.getFullYear();
  }
  
  return false;
};

// Helper function to reset a habit
const resetHabit = async (habit, today) => {
  habit.lastReset = new Date();
  
  // Filter entries to only keep entries from the current reset period
  if (habit.resetCounter === 'daily') {
    // Keep only today's entries
    habit.entries = habit.entries.filter(e => {
      const entryDate = new Date(e.date);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === today.getTime();
    });
  } else if (habit.resetCounter === 'weekly') {
    // Keep only entries from the last 7 days
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    habit.entries = habit.entries.filter(e => {
      const entryDate = new Date(e.date);
      return entryDate >= weekAgo;
    });
  } else if (habit.resetCounter === 'monthly') {
    // Keep only entries from the current month
    habit.entries = habit.entries.filter(e => {
      const entryDate = new Date(e.date);
      return entryDate.getMonth() === today.getMonth() && 
             entryDate.getFullYear() === today.getFullYear();
    });
  }
  
  // Recalculate currentCount based on filtered entries
  habit.currentCount = habit.entries.length;
  
  await habit.save();
};

// Get all habits
router.get('/', async (req, res) => {
  try {
    const habits = await Habit.find().sort({ order: 1, createdAt: -1 });
    
    // Auto-reset habits if needed
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (const habit of habits) {
      if (shouldResetHabit(habit, today)) {
        await resetHabit(habit, today);
      }
    }
    
    // Fetch again to get updated habits
    const updatedHabits = await Habit.find().sort({ order: 1, createdAt: -1 });
    res.json(updatedHabits);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get habit by ID
router.get('/:id', async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    
    // Auto-reset habit if needed
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (shouldResetHabit(habit, today)) {
      await resetHabit(habit, today);
      // Fetch again to get updated habit
      const updatedHabit = await Habit.findById(req.params.id);
      return res.json(updatedHabit);
    }
    
    res.json(habit);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create habit
router.post('/', async (req, res) => {
  try {
    // Set order to last if not provided
    if (req.body.order === undefined) {
      const maxOrderHabit = await Habit.findOne().sort({ order: -1 });
      req.body.order = maxOrderHabit ? maxOrderHabit.order + 1 : 0;
    }
    const habit = new Habit(req.body);
    await habit.save();
    res.status(201).json(habit);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update habit
router.put('/:id', async (req, res) => {
  try {
    const habit = await Habit.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    res.json(habit);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Record habit (+ or -)
router.post('/:id/record', async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    
    const { action } = req.body; // 'positive' or 'negative'
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Auto-reset habit if needed before recording
    if (shouldResetHabit(habit, today)) {
      await resetHabit(habit, today);
      // Reload habit to get updated entries
      const reloadedHabit = await Habit.findById(req.params.id);
      if (reloadedHabit) {
        habit.entries = reloadedHabit.entries;
        habit.currentCount = reloadedHabit.currentCount;
      }
    }
    
    // Check if already recorded today
    const todayEntry = habit.entries.find(e => {
      const entryDate = new Date(e.date);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === today.getTime();
    });
    
    const user = await User.findOne();
    const difficulty = user?.settings.difficulty[habit.difficulty];
    
    if (action === 'positive') {
      if (habit.type === 'positive' || habit.type === 'both') {
        habit.currentCount += 1;
        habit.entries.push({ date: new Date(), value: 1 });
        
        // Give reward
        if (user && difficulty) {
          user.addXP(difficulty.reward.xp);
          user.coins += difficulty.reward.coins;
          await user.save();
        }
        
        // Update streak
        if (!todayEntry) {
          habit.streak += 1;
        }
      }
    } else if (action === 'negative') {
      if (habit.type === 'negative' || habit.type === 'both') {
        habit.currentCount += 1;
        habit.entries.push({ date: new Date(), value: -1 });
        
        // Apply punishment
        if (user && difficulty) {
          user.coins += difficulty.punishment.coins;
          await user.save();
        }
      } else {
        // Negative action on positive habit = punishment
        if (user && difficulty) {
          user.coins += difficulty.punishment.coins;
          await user.save();
        }
      }
    }
    
    await habit.save();
    res.json(habit);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset habit counter
router.post('/:id/reset', async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    
    habit.currentCount = 0;
    habit.lastReset = new Date();
    await habit.save();
    
    res.json(habit);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reorder habits
router.post('/reorder', async (req, res) => {
  try {
    const { habitIds } = req.body; // Array of habit IDs in new order
    if (!Array.isArray(habitIds)) {
      return res.status(400).json({ error: 'habitIds must be an array' });
    }
    
    // Update order for each habit
    const updatePromises = habitIds.map((id, index) => 
      Habit.findByIdAndUpdate(id, { order: index }, { new: true })
    );
    
    await Promise.all(updatePromises);
    res.json({ message: 'Habits reordered' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Move habit to top
router.post('/:id/move-to-top', async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    
    // Get minimum order
    const minOrderHabit = await Habit.findOne().sort({ order: 1 });
    const minOrder = minOrderHabit ? minOrderHabit.order : 0;
    
    // Set this habit's order to minOrder - 1
    habit.order = minOrder - 1;
    await habit.save();
    
    res.json(habit);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Move habit to bottom
router.post('/:id/move-to-bottom', async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    
    // Get maximum order
    const maxOrderHabit = await Habit.findOne().sort({ order: -1 });
    const maxOrder = maxOrderHabit ? maxOrderHabit.order : 0;
    
    // Set this habit's order to maxOrder + 1
    habit.order = maxOrder + 1;
    await habit.save();
    
    res.json(habit);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete habit
router.delete('/:id', async (req, res) => {
  try {
    const habit = await Habit.findByIdAndDelete(req.params.id);
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    res.json({ message: 'Habit deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

