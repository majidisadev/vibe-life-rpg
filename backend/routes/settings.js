import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Get settings
router.get('/', async (req, res) => {
  try {
    let user = await User.findOne();
    if (!user) {
      user = await new User().save();
    }
    res.json(user.settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update settings
router.put('/', async (req, res) => {
  try {
    let user = await User.findOne();
    if (!user) {
      user = await new User().save();
    }
    
    const { tags, difficulty, financeCategories, budgetPerYear, currency, showRealMoney, pomodoroDailyGoal, pomodoroXP } = req.body;
    
    if (tags) user.settings.tags = tags;
    if (difficulty) {
      if (difficulty.easy) user.settings.difficulty.easy = { ...user.settings.difficulty.easy, ...difficulty.easy };
      if (difficulty.medium) user.settings.difficulty.medium = { ...user.settings.difficulty.medium, ...difficulty.medium };
      if (difficulty.hard) user.settings.difficulty.hard = { ...user.settings.difficulty.hard, ...difficulty.hard };
    }
    if (financeCategories) user.settings.financeCategories = financeCategories;
    if (budgetPerYear !== undefined) user.settings.budgetPerYear = budgetPerYear;
    if (currency) user.settings.currency = currency;
    if (showRealMoney !== undefined) user.settings.showRealMoney = showRealMoney;
    if (pomodoroDailyGoal !== undefined) {
      const goal = Math.max(0, Math.min(480, pomodoroDailyGoal)); // max 8 hours
      user.settings.pomodoroDailyGoal = goal;
    }
    if (pomodoroXP !== undefined) {
      user.settings.pomodoroXP = Math.max(0, pomodoroXP);
    }
    
    await user.save();
    res.json(user.settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

