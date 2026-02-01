import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Get user (single user system)
router.get('/', async (req, res) => {
  try {
    let user = await User.findOne();
    if (!user) {
      user = await new User().save();
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user
router.put('/', async (req, res) => {
  try {
    let user = await User.findOne();
    if (!user) {
      user = await new User().save();
    }
    
    const { name, avatar, profilePicture, coverImage, settings, bookmarks } = req.body;
    if (name !== undefined) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;
    if (coverImage !== undefined) user.coverImage = coverImage;
    if (bookmarks !== undefined) user.bookmarks = bookmarks;
    if (settings !== undefined) {
      if (settings.tags) user.settings.tags = settings.tags;
      if (settings.difficulty) user.settings.difficulty = settings.difficulty;
      if (settings.financeCategories) user.settings.financeCategories = settings.financeCategories;
      if (settings.budgetPerYear !== undefined) user.settings.budgetPerYear = settings.budgetPerYear;
      if (settings.currency) user.settings.currency = settings.currency;
      if (settings.showRealMoney !== undefined) user.settings.showRealMoney = settings.showRealMoney;
      if (settings.pomodoroDailyGoal !== undefined) {
        const goal = Math.max(0, Math.min(480, settings.pomodoroDailyGoal)); // max 8 hours
        user.settings.pomodoroDailyGoal = goal;
      }
      if (settings.pomodoroXP !== undefined) {
        user.settings.pomodoroXP = Math.max(0, settings.pomodoroXP);
      }
      if (settings.theme && ['spring', 'summer', 'autumn', 'winter'].includes(settings.theme)) {
        user.settings.theme = settings.theme;
      }
      if (settings.darkMode && ['light', 'dark'].includes(settings.darkMode)) {
        user.settings.darkMode = settings.darkMode;
      }
      if (settings.marketRates) user.settings.marketRates = settings.marketRates;
    }
    
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add energy from sleep
router.post('/sleep', async (req, res) => {
  try {
    let user = await User.findOne();
    if (!user) {
      user = await new User().save();
    }
    
    const { hours } = req.body;
    user.addEnergyFromSleep(hours);
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add pomodoro
router.post('/pomodoro', async (req, res) => {
  try {
    let user = await User.findOne();
    if (!user) {
      user = await new User().save();
    }
    
    const { minutes, hour } = req.body;
    const pomodoroMinutes = minutes || 25;
    // Only mark as completed if it's a full 25-minute session (automatic completion)
    const completed = pomodoroMinutes === 25;
    user.addPomodoro(pomodoroMinutes, hour !== undefined ? hour : null, completed);
    
    // Add build power if pomodoro session is completed (25 minutes = 25 build power)
    if (completed) {
      user.buildPower += 25;
    }
    
    // Add XP reward for completing pomodoro session
    const pomodoroXP = user.settings?.pomodoroXP || 10;
    const leveledUp = user.addXP(pomodoroXP);
    
    await user.save();
    
    res.json({ user, xpAdded: pomodoroXP, leveledUp });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pomodoro progress
router.get('/pomodoro/progress', async (req, res) => {
  try {
    let user = await User.findOne();
    if (!user) {
      user = await new User().save();
    }
    
    const progress = user.getPomodoroProgress();
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get monthly pomodoro data
router.get('/pomodoro/monthly', async (req, res) => {
  try {
    let user = await User.findOne();
    if (!user) {
      user = await new User().save();
    }
    
    const year = req.query.year ? parseInt(req.query.year) : null;
    const month = req.query.month ? parseInt(req.query.month) : null;
    
    const monthlyData = user.getMonthlyPomodoroData(year, month);
    res.json(monthlyData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add XP and coins
router.post('/reward', async (req, res) => {
  try {
    let user = await User.findOne();
    if (!user) {
      user = await new User().save();
    }
    
    const { xp, coins } = req.body;
    if (xp) user.addXP(xp);
    if (coins) user.coins += coins;
    
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset stats (level, xp, coins, energy)
router.post('/reset-stats', async (req, res) => {
  try {
    let user = await User.findOne();
    if (!user) {
      user = await new User().save();
    }
    
    user.level = 0;
    user.xp = 0;
    user.coins = 0;
    user.energy = 0;
    
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update active characters (manage population slot)
router.put('/active-characters', async (req, res) => {
  try {
    let user = await User.findOne();
    if (!user) {
      user = await new User().save();
    }
    
    const { activeCharacters } = req.body;
    
    if (!Array.isArray(activeCharacters)) {
      return res.status(400).json({ error: 'activeCharacters must be an array' });
    }
    
    // Validate population slot
    if (activeCharacters.length > user.maxPopulation) {
      return res.status(400).json({ 
        error: `Cannot exceed max population (${user.maxPopulation})` 
      });
    }
    
    // Validate that all characters are from collectedCharacters
    const invalidCharacters = activeCharacters.filter(
      (charId) => !user.collectedCharacters.includes(charId)
    );
    
    if (invalidCharacters.length > 0) {
      return res.status(400).json({ 
        error: 'All active characters must be from collected characters' 
      });
    }
    
    user.activeCharacters = activeCharacters;
    await user.save();
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

