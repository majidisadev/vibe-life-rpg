import express from "express";
import Task from "../models/Task.js";
import User from "../models/User.js";

const router = express.Router();

// Get all tasks
router.get("/", async (req, res) => {
  try {
    const tasks = await Task.find().sort({ order: 1, createdAt: -1 });
    
    // Auto-reset tasks if needed
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    for (const task of tasks) {
      if (shouldResetTask(task, today)) {
        task.completed = false;
        task.completedDate = null;
        task.skipped = false;
        task.skippedDate = null;
        task.lastReset = new Date();
        await task.save();
      }
    }
    
    // Fetch again to get updated tasks
    const updatedTasks = await Task.find().sort({ order: 1, createdAt: -1 });
    res.json(updatedTasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get task by ID
router.get("/:id", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    
    // Auto-reset task if needed
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (shouldResetTask(task, today)) {
      task.completed = false;
      task.completedDate = null;
      task.skipped = false;
      task.skippedDate = null;
      task.lastReset = new Date();
      await task.save();
      // Fetch again to get updated task
      const updatedTask = await Task.findById(req.params.id);
      return res.json(updatedTask);
    }
    
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create task
router.post("/", async (req, res) => {
  try {
    // Set order to last if not provided
    if (req.body.order === undefined) {
      const maxOrderTask = await Task.findOne().sort({ order: -1 });
      req.body.order = maxOrderTask ? maxOrderTask.order + 1 : 0;
    }
    const task = new Task(req.body);
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update task
router.put("/:id", async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Complete task
router.post("/:id/complete", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    if (task.completed) {
      return res.status(400).json({ error: "Task already completed" });
    }

    task.completed = true;
    task.completedDate = new Date();
    task.skipped = false;
    task.skippedDate = null;
    await task.save();

    // Give rewards
    const user = await User.findOne();
    if (user) {
      const difficulty = user.settings.difficulty[task.difficulty];
      user.addXP(difficulty.reward.xp);
      user.coins += difficulty.reward.coins;
      await user.save();
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Skip task (won't do)
router.post("/:id/skip", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    if (task.skipped) {
      return res.status(400).json({ error: "Task already skipped" });
    }

    task.skipped = true;
    task.skippedDate = new Date();
    task.completed = false;
    task.completedDate = null;
    await task.save();

    // Apply punishment
    const user = await User.findOne();
    if (user) {
      const difficulty = user.settings.difficulty[task.difficulty];
      if (difficulty.punishment && difficulty.punishment.coins) {
        user.coins += difficulty.punishment.coins; // This will be negative
        await user.save();
      }
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to check if a task should be reset
const shouldResetTask = (task, today) => {
  // Only reset completed or skipped tasks
  if (!task.completed && !task.skipped) return false;

  // If no lastReset, don't reset (it's a new task)
  if (!task.lastReset) return false;

  // Check if task has been reset today already
  const lastReset = new Date(task.lastReset);
  lastReset.setHours(0, 0, 0, 0);
  if (lastReset.getTime() === today.getTime()) return false;

  // Check if task has started
  if (task.startDate) {
    const startDate = new Date(task.startDate);
    startDate.setHours(0, 0, 0, 0);
    if (startDate > today) return false;
  }

  if (task.repeatType === "daily") {
    // Daily tasks reset every day
    return lastReset < today;
  }

  if (task.repeatType === "weekly") {
    const repeatOn = task.repeatOn || [];
    if (repeatOn.length === 0) {
      // If no repeatOn specified, reset based on repeatEvery weeks
      const daysSinceStart = Math.floor((today - new Date(task.startDate || task.createdAt)) / (1000 * 60 * 60 * 24));
      return daysSinceStart % (7 * (task.repeatEvery || 1)) === 0 && lastReset < today;
    }
    // Check if today's day of week is in repeatOn
    const todayDayOfWeek = today.getDay();
    return repeatOn.includes(todayDayOfWeek) && lastReset < today;
  }

  if (task.repeatType === "monthly") {
    const repeatOn = task.repeatOn || [];
    if (repeatOn.length === 0) {
      // If no repeatOn specified, reset on same date every month
      const startDate = new Date(task.startDate || task.createdAt);
      return today.getDate() === startDate.getDate() && lastReset < today;
    }
    // Check if today's date is in repeatOn
    const todayDate = today.getDate();
    return repeatOn.includes(todayDate) && lastReset < today;
  }

  return false;
};

// Reset tasks (daily, weekly, monthly)
router.post("/reset", async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get all completed or skipped tasks that might need reset
    const tasks = await Task.find({
      $or: [{ completed: true }, { skipped: true }],
      repeatType: { $in: ["daily", "weekly", "monthly"] },
    });

    const tasksToReset = [];
    for (const task of tasks) {
      if (shouldResetTask(task, today)) {
        task.completed = false;
        task.completedDate = null;
        task.skipped = false;
        task.skippedDate = null;
        task.lastReset = new Date();
        await task.save();
        tasksToReset.push(task);
      }
    }

    res.json({ reset: tasksToReset.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reorder tasks
router.post("/reorder", async (req, res) => {
  try {
    const { taskIds } = req.body; // Array of task IDs in new order
    if (!Array.isArray(taskIds)) {
      return res.status(400).json({ error: "taskIds must be an array" });
    }

    // Update order for each task
    const updatePromises = taskIds.map((id, index) =>
      Task.findByIdAndUpdate(id, { order: index }, { new: true })
    );

    await Promise.all(updatePromises);
    res.json({ message: "Tasks reordered" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Move task to top
router.post("/:id/move-to-top", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Get minimum order
    const minOrderTask = await Task.findOne().sort({ order: 1 });
    const minOrder = minOrderTask ? minOrderTask.order : 0;

    // Set this task's order to minOrder - 1
    task.order = minOrder - 1;
    await task.save();

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Move task to bottom
router.post("/:id/move-to-bottom", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Get maximum order
    const maxOrderTask = await Task.findOne().sort({ order: -1 });
    const maxOrder = maxOrderTask ? maxOrderTask.order : 0;

    // Set this task's order to maxOrder + 1
    task.order = maxOrder + 1;
    await task.save();

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle checklist item
router.post("/:id/checklist/:index/toggle", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const index = parseInt(req.params.index);
    if (index < 0 || index >= task.checklist.length) {
      return res.status(400).json({ error: "Invalid checklist index" });
    }

    // Toggle the checked status
    task.checklist[index].checked = !task.checklist[index].checked;
    await task.save();

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete task
router.delete("/:id", async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json({ message: "Task deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
