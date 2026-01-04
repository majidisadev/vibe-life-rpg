import express from 'express';
import Wishlist from '../models/Wishlist.js';
import User from '../models/User.js';
import Finance from '../models/Finance.js';

const router = express.Router();

// Get all wishlist items
router.get('/', async (req, res) => {
  try {
    const wishlist = await Wishlist.find().sort({ priority: 1, createdAt: -1 });
    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get wishlist item by ID
router.get('/:id', async (req, res) => {
  try {
    const item = await Wishlist.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Wishlist item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create wishlist item
router.post('/', async (req, res) => {
  try {
    const wishlistItem = new Wishlist(req.body);
    await wishlistItem.save();
    res.status(201).json(wishlistItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update wishlist item
router.put('/:id', async (req, res) => {
  try {
    const item = await Wishlist.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) {
      return res.status(404).json({ error: 'Wishlist item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete wishlist item
router.delete('/:id', async (req, res) => {
  try {
    const item = await Wishlist.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Wishlist item not found' });
    }
    res.json({ message: 'Wishlist item deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Purchase wishlist item
router.post('/:id/purchase', async (req, res) => {
  try {
    const item = await Wishlist.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Wishlist item not found' });
    }

    if (item.purchased) {
      return res.status(400).json({ error: 'Item already purchased' });
    }

    const user = await User.findOne();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Require both coins and money for purchase
    if (item.coinPrice <= 0) {
      return res.status(400).json({ error: 'Item must have a coin price' });
    }
    if (item.price <= 0) {
      return res.status(400).json({ error: 'Item must have a money price' });
    }

    // Check if user has enough coins
    if (user.coins < item.coinPrice) {
      return res.status(400).json({ error: 'Not enough coins' });
    }

    // Calculate balance from finance transactions
    const transactions = await Finance.find();
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalOutcomes = transactions
      .filter(t => t.type === 'outcome')
      .reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalOutcomes;

    // Check if user has enough balance
    if (balance < item.price) {
      return res.status(400).json({ error: 'Not enough balance' });
    }

    // Deduct coins
    user.coins -= item.coinPrice;

    // Create finance outcome transaction for the purchase
    const purchaseTransaction = new Finance({
      type: 'outcome',
      amount: item.price,
      category: 'Wishlist Purchase',
      description: `Purchased: ${item.name}`,
      date: new Date()
    });
    await purchaseTransaction.save();

    // Mark item as purchased
    item.purchased = true;
    item.purchasedAt = new Date();
    item.purchasedWith = 'both'; // Since we're using both methods
    await item.save();
    await user.save();

    res.json({ 
      item,
      user,
      message: 'Item purchased successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

