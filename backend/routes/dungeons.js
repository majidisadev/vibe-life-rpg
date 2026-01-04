import express from "express";
import Dungeon from "../models/Dungeon.js";
import Character from "../models/Character.js";
import User from "../models/User.js";
import Weapon from "../models/Weapon.js";

const router = express.Router();

// Get all dungeons
router.get("/", async (req, res) => {
  try {
    const dungeons = await Dungeon.find()
      .populate({
        path: "stages.enemy",
        model: "Character"
      })
      .sort({ createdAt: -1 });
    res.json(dungeons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get dungeon by ID
router.get("/:id", async (req, res) => {
  try {
    const dungeon = await Dungeon.findById(req.params.id).populate({
      path: "stages.enemy",
      model: "Character"
    });
    if (!dungeon) {
      return res.status(404).json({ error: "Dungeon not found" });
    }
    res.json(dungeon);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create dungeon
router.post("/", async (req, res) => {
  try {
    // Clean up the request body
    const dungeonData = { ...req.body };

    // Ensure stages array is properly formatted (can be empty)
    if (!Array.isArray(dungeonData.stages)) {
      dungeonData.stages = [];
    } else if (Array.isArray(dungeonData.stages)) {
      // Process stages: convert empty enemy strings to null
      dungeonData.stages = dungeonData.stages.map((stage) => ({
        stageNumber: stage.stageNumber,
        enemy:
          stage.enemy === "" || stage.enemy === undefined ? null : stage.enemy,
        unlocked: stage.unlocked || false,
      }));
    }

    const dungeon = new Dungeon(dungeonData);
    await dungeon.save();
    
    // Populate enemy after saving
    const populatedDungeon = await Dungeon.findById(dungeon._id).populate({
      path: "stages.enemy",
      model: "Character"
    });
    
    res.status(201).json(populatedDungeon);
  } catch (error) {
    console.error("Error creating dungeon:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update dungeon
router.put("/:id", async (req, res) => {
  try {
    // Clean up the request body
    const dungeonData = { ...req.body };

    // Ensure stages array is properly formatted
    if (
      dungeonData.stages !== undefined &&
      !Array.isArray(dungeonData.stages)
    ) {
      dungeonData.stages = [];
    } else if (Array.isArray(dungeonData.stages)) {
      // Process stages: convert empty enemy strings to null
      dungeonData.stages = dungeonData.stages.map((stage) => ({
        stageNumber: stage.stageNumber,
        enemy:
          stage.enemy === "" || stage.enemy === undefined ? null : stage.enemy,
        unlocked: stage.unlocked || false,
      }));
    }

    const dungeon = await Dungeon.findByIdAndUpdate(
      req.params.id,
      dungeonData,
      { new: true, runValidators: true }
    ).populate({
      path: "stages.enemy",
      model: "Character"
    });
    if (!dungeon) {
      return res.status(404).json({ error: "Dungeon not found" });
    }
    res.json(dungeon);
  } catch (error) {
    console.error("Error updating dungeon:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete dungeon
router.delete("/:id", async (req, res) => {
  try {
    const dungeon = await Dungeon.findByIdAndDelete(req.params.id);
    if (!dungeon) {
      return res.status(404).json({ error: "Dungeon not found" });
    }
    res.json({ message: "Dungeon deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unlock dungeon endpoint
router.post("/:id/unlock", async (req, res) => {
  try {
    const user = await User.findOne();
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const dungeon = await Dungeon.findById(req.params.id);
    if (!dungeon) {
      return res.status(404).json({ error: "Dungeon not found" });
    }

    if (dungeon.unlocked) {
      return res.status(400).json({ error: "Dungeon already unlocked" });
    }

    if (user.level < dungeon.minLevel) {
      return res.status(400).json({
        error: `Requires level ${dungeon.minLevel} to unlock. Your level: ${user.level}`,
      });
    }

    dungeon.unlocked = true;
    // Auto-unlock first stage
    if (dungeon.stages.length > 0) {
      dungeon.stages[0].unlocked = true;
    }
    await dungeon.save();

    res.json({ success: true, dungeon });
  } catch (error) {
    console.error("Error unlocking dungeon:", error);
    res.status(500).json({ error: error.message });
  }
});

// Attack enemy in dungeon stage
router.post("/:id/attack", async (req, res) => {
  try {
    const user = await User.findOne();
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.energy < 1) {
      return res.status(400).json({ error: "Not enough energy" });
    }

    const dungeon = await Dungeon.findById(req.params.id).populate({
      path: "stages.enemy",
      model: "Character"
    });
    if (!dungeon) {
      return res.status(404).json({ error: "Dungeon not found" });
    }

    if (!dungeon.unlocked) {
      return res.status(400).json({ error: "Dungeon not unlocked" });
    }

    // Get user's dungeon progress
    let progress = user.dungeonProgress.find(
      (p) => p.dungeonId.toString() === dungeon._id.toString()
    );

    if (!progress) {
      // Initialize progress
      progress = {
        dungeonId: dungeon._id,
        currentStage: 0,
        completed: false,
        currentEnemyHP: null,
      };
      user.dungeonProgress.push(progress);
      progress = user.dungeonProgress[user.dungeonProgress.length - 1];

      // Auto-unlock first stage if not already unlocked
      if (dungeon.stages.length > 0 && !dungeon.stages[0].unlocked) {
        dungeon.stages[0].unlocked = true;
        await dungeon.save();
      }
    }

    if (progress.completed) {
      return res.status(400).json({ error: "Dungeon already completed" });
    }

    // Determine current enemy from stage
    if (progress.currentStage >= dungeon.stages.length) {
      return res.status(400).json({ error: "All stages completed" });
    }

    const currentStage = dungeon.stages[progress.currentStage];
    if (!currentStage.unlocked) {
      return res.status(400).json({ error: "Stage not unlocked" });
    }

    const currentEnemy = currentStage.enemy;
    if (!currentEnemy || !currentEnemy.enemyStats) {
      return res.status(400).json({ error: "Invalid enemy" });
    }

    // Calculate damage
    const weapon = user.equippedWeapon
      ? await Weapon.findById(user.equippedWeapon)
      : null;
    const totalDamage = user.baseAttack + (weapon ? weapon.damageBonus : 0);

    // Initialize or get current HP
    if (
      progress.currentEnemyHP === null ||
      progress.currentEnemyHP === undefined
    ) {
      progress.currentEnemyHP = currentEnemy.enemyStats.hp;
    }

    // Reduce HP
    progress.currentEnemyHP -= totalDamage;
    const damageDealt = totalDamage;

    // Consume energy
    user.energy -= 1;

    // Check if enemy is defeated
    const enemyDefeated = progress.currentEnemyHP <= 0;

    if (enemyDefeated) {
      // Give rewards
      const reward = currentEnemy.enemyStats.baseReward;
      if (reward.xp) user.addXP(reward.xp);
      if (reward.coins) user.coins += reward.coins;
      if (reward.resources) {
        user.resources.meat += reward.resources.meat || 0;
        user.resources.wood += reward.resources.wood || 0;
        user.resources.stone += reward.resources.stone || 0;
        user.resources.iron += reward.resources.iron || 0;
        user.resources.crystal += reward.resources.crystal || 0;
      }

      // Reset HP for next enemy
      progress.currentEnemyHP = null;

      // Stage enemy defeated, unlock next stage
      progress.currentStage += 1;
      if (progress.currentStage < dungeon.stages.length) {
        // Unlock next stage
        dungeon.stages[progress.currentStage].unlocked = true;
        await dungeon.save();
      } else {
        // All stages completed, dungeon completed
        progress.completed = true;
        dungeon.completed = true;
        await dungeon.save();
      }
    }

    await user.save();

    res.json({
      success: true,
      damageDealt,
      enemyHP: Math.max(0, progress.currentEnemyHP),
      enemyDefeated,
      reward: enemyDefeated ? currentEnemy.enemyStats.baseReward : null,
      dungeon: await Dungeon.findById(req.params.id).populate({
        path: "stages.enemy",
        model: "Character"
      }),
    });
  } catch (error) {
    console.error("Error attacking dungeon:", error);
    res.status(500).json({ error: error.message });
  }
});

// Unlock next stage (manual unlock if needed)
router.post("/:id/next-stage", async (req, res) => {
  try {
    const dungeon = await Dungeon.findById(req.params.id);
    if (!dungeon) {
      return res.status(404).json({ error: "Dungeon not found" });
    }

    const { stageNumber } = req.body;
    const stage = dungeon.stages.find((s) => s.stageNumber === stageNumber);
    if (stage) {
      stage.unlocked = true;
      await dungeon.save();
    }

    res.json(dungeon);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Restart dungeon
router.post("/:id/restart", async (req, res) => {
  try {
    const user = await User.findOne();
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const dungeon = await Dungeon.findById(req.params.id);
    if (!dungeon) {
      return res.status(404).json({ error: "Dungeon not found" });
    }

    // Find user's progress for this dungeon
    const progress = user.dungeonProgress.find(
      (p) => p.dungeonId.toString() === dungeon._id.toString()
    );

    if (!progress) {
      return res
        .status(400)
        .json({ error: "No progress found for this dungeon" });
    }

    // Reset progress
    progress.currentStage = 0;
    progress.completed = false;
    progress.currentEnemyHP = null;

    // Reset dungeon stages - only first stage unlocked
    if (dungeon.stages.length > 0) {
      dungeon.stages.forEach((stage, index) => {
        stage.unlocked = index === 0;
      });
      dungeon.completed = false;
      await dungeon.save();
    }

    await user.save();

    res.json({
      success: true,
      dungeon: await Dungeon.findById(req.params.id).populate({
        path: "stages.enemy",
        model: "Character"
      }),
      user,
    });
  } catch (error) {
    console.error("Error restarting dungeon:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
