import express from 'express';
import Finance from '../models/Finance.js';
import User from '../models/User.js';

const router = express.Router();

// Get all finance entries
router.get('/', async (req, res) => {
  try {
    const { page, limit } = req.query;
    
    // Pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;
    
    // Get total count for pagination info
    const total = await Finance.countDocuments();
    
    // Get paginated data
    const finances = await Finance.find()
      .sort({ date: -1 })
      .skip(skip)
      .limit(limitNum);
    
    res.json({
      data: finances,
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

// Get finance by ID
router.get('/:id', async (req, res) => {
  try {
    const finance = await Finance.findById(req.params.id);
    if (!finance) {
      return res.status(404).json({ error: 'Finance entry not found' });
    }
    res.json(finance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create finance entry
router.post('/', async (req, res) => {
  try {
    const finance = new Finance(req.body);
    await finance.save();
    res.status(201).json(finance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update finance entry
router.put('/:id', async (req, res) => {
  try {
    const finance = await Finance.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!finance) {
      return res.status(404).json({ error: 'Finance entry not found' });
    }
    res.json(finance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete finance entry
router.delete('/:id', async (req, res) => {
  try {
    const finance = await Finance.findByIdAndDelete(req.params.id);
    if (!finance) {
      return res.status(404).json({ error: 'Finance entry not found' });
    }
    res.json({ message: 'Finance entry deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get budget overview
router.get('/budget/overview', async (req, res) => {
  try {
    const user = await User.findOne();
    const budgetPerYear = user?.settings.budgetPerYear || 0;
    
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear(), 11, 31);
    
    const outcomes = await Finance.find({
      type: 'outcome',
      date: { $gte: yearStart, $lte: yearEnd }
    });
    
    const totalExpenses = outcomes.reduce((sum, exp) => sum + exp.amount, 0);
    const remaining = budgetPerYear - totalExpenses;
    
    res.json({
      budgetPerYear,
      totalExpenses,
      remaining,
      percentageUsed: budgetPerYear > 0 ? (totalExpenses / budgetPerYear) * 100 : 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

