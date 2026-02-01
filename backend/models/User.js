import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, default: "Player" },
    avatar: { type: String, default: "🎮" },
    profilePicture: { type: String, default: "" },
    coverImage: { type: String, default: "" },
    level: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
    coins: { type: Number, default: 0 },
    energy: { type: Number, default: 0, max: 24 },
    pomodoroCount: { type: Number, default: 0 },
    buildPower: { type: Number, default: 0 }, // Build power from completed pomodoro sessions (25 per session)
    resources: {
      meat: { type: Number, default: 0 },
      wood: { type: Number, default: 0 },
      stone: { type: Number, default: 0 },
      iron: { type: Number, default: 0 },
      crystal: { type: Number, default: 0 },
    },
    baseAttack: { type: Number, default: 1 },
    equippedWeapon: { type: mongoose.Schema.Types.ObjectId, ref: "Weapon" },
    activeCharacters: [{ type: mongoose.Schema.Types.ObjectId, ref: "Character" }],
    maxPopulation: { type: Number, default: 5 },
    collectedCharacters: [{ type: mongoose.Schema.Types.ObjectId, ref: "Character" }],
    dungeonProgress: [
      {
        dungeonId: { type: mongoose.Schema.Types.ObjectId, ref: "Dungeon" },
        currentStage: { type: Number, default: 0 },
        completed: { type: Boolean, default: false },
        currentEnemyHP: { type: Number, default: null }, // Track current enemy HP
      },
    ],
    settings: {
      tags: {
        type: [String],
        default: [
          "chores",
          "creativity",
          "exercise",
          "health",
          "school",
          "work",
        ],
      },
      difficulty: {
        type: mongoose.Schema.Types.Mixed,
        default: {
          easy: {
            reward: { xp: 1, coins: 1 },
            punishment: { coins: -1 },
          },
          medium: {
            reward: { xp: 5, coins: 5 },
            punishment: { coins: -5 },
          },
          hard: {
            reward: { xp: 10, coins: 10 },
            punishment: { coins: -10 },
          },
        },
      },
      financeCategories: {
        type: [
          {
            name: { type: String, required: true },
            type: { type: String, enum: ["income", "outcome"], required: true },
          },
        ],
        default: [],
      },
      budgetPerYear: { type: Number, default: 0 },
      currency: { type: String, default: "USD" },
      showRealMoney: { type: Boolean, default: false },
      pomodoroDailyGoal: { type: Number, default: 60, min: 0, max: 480 }, // in minutes, max 8 hours
      pomodoroXP: { type: Number, default: 10, min: 0 }, // XP reward for completing a pomodoro session
      theme: { type: String, enum: ['spring', 'summer', 'autumn', 'winter'], default: 'spring' }, // UI theme: spring=green, summer=yellow, autumn=orange, winter=blue
      darkMode: { type: String, enum: ['light', 'dark'], default: 'light' }, // UI appearance: light or dark
    },
    pomodoroEntries: [
      {
        date: { type: Date, default: Date.now },
        minutes: { type: Number, default: 25 }, // minutes completed
        hour: { type: Number }, // hour when pomodoro was completed (0-23)
        completed: { type: Boolean, default: true }, // true if pomodoro session completed (25 min), false if stopped early
      },
    ],
  },
  { timestamps: true }
);

// Calculate XP required for next level
userSchema.methods.getXPForNextLevel = function () {
  return 100 + this.level * 100;
};

// Add XP and level up if needed
userSchema.methods.addXP = function (amount) {
  this.xp += amount;
  let leveledUp = false;

  while (this.xp >= this.getXPForNextLevel()) {
    this.xp -= this.getXPForNextLevel();
    this.level += 1;
    leveledUp = true;
  }

  return leveledUp;
};

// Add energy from sleep (1 hour = 1 energy, max 24)
userSchema.methods.addEnergyFromSleep = function (hours) {
  const energyToAdd = Math.floor(hours);
  this.energy = Math.min(24, this.energy + energyToAdd);
};

// Add pomodoro
userSchema.methods.addPomodoro = function (minutes = 25, hour = null, completed = true) {
  this.pomodoroCount += 1;

  // Use provided hour or get current hour
  const now = new Date();
  const pomodoroHour = hour !== null ? hour : now.getHours();

  // Always create a new entry with hour information for monthly stats
  this.pomodoroEntries.push({
    date: new Date(),
    minutes,
    hour: pomodoroHour,
    completed: completed, // true if pomodoro completed (25 min), false if stopped early
  });
};

// Get daily progress stats
userSchema.methods.getPomodoroProgress = function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Get today's minutes - only count completed pomodoro sessions
  const todayCompletedEntries = this.pomodoroEntries.filter((e) => {
    const entryDate = new Date(e.date);
    entryDate.setHours(0, 0, 0, 0);
    const isToday = entryDate.getTime() === today.getTime();
    const isCompleted = e.completed !== false && (e.completed === true || e.minutes === 25);
    return isToday && isCompleted;
  });
  const todayMinutes = todayCompletedEntries.reduce((sum, e) => sum + (e.minutes || 0), 0);

  // Get yesterday's minutes - only count completed pomodoro sessions
  const yesterdayCompletedEntries = this.pomodoroEntries.filter((e) => {
    const entryDate = new Date(e.date);
    entryDate.setHours(0, 0, 0, 0);
    const isYesterday = entryDate.getTime() === yesterday.getTime();
    const isCompleted = e.completed !== false && (e.completed === true || e.minutes === 25);
    return isYesterday && isCompleted;
  });
  const yesterdayMinutes = yesterdayCompletedEntries.reduce((sum, e) => sum + (e.minutes || 0), 0);

  const dailyGoal = this.settings?.pomodoroDailyGoal || 60;

  // Calculate streak
  let streak = 0;
  const sortedEntries = [...this.pomodoroEntries].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  // Group entries by date - only count completed pomodoro sessions
  const entriesByDate = {};
  sortedEntries.forEach((entry) => {
    const isCompleted = entry.completed !== false && (entry.completed === true || entry.minutes === 25);
    if (!isCompleted) return; // Skip incomplete pomodoro sessions
    
    const entryDate = new Date(entry.date);
    entryDate.setHours(0, 0, 0, 0);
    const dateKey = entryDate.toISOString().split("T")[0];
    if (!entriesByDate[dateKey]) {
      entriesByDate[dateKey] = { date: entryDate, minutes: 0 };
    }
    entriesByDate[dateKey].minutes += entry.minutes;
  });

  // Calculate streak from today backwards
  // Streak only increases if daily goal is met for that day
  let checkDate = new Date(today);
  while (true) {
    const dateKey = checkDate.toISOString().split("T")[0];
    if (entriesByDate[dateKey] && entriesByDate[dateKey].minutes >= dailyGoal) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return {
    todayMinutes,
    yesterdayMinutes,
    streak,
    dailyGoal,
    completed: todayMinutes,
    progress: Math.min(100, (todayMinutes / dailyGoal) * 100),
  };
};

// Get monthly pomodoro data for heatmap
userSchema.methods.getMonthlyPomodoroData = function (
  year = null,
  month = null
) {
  const now = new Date();
  const targetYear = year !== null ? year : now.getFullYear();
  const targetMonth = month !== null ? month : now.getMonth(); // 0-11

  // Get start and end of month
  const startDate = new Date(targetYear, targetMonth, 1);
  const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

  // Filter entries for the target month - only show completed pomodoro sessions
  const monthEntries = this.pomodoroEntries.filter((entry) => {
    const entryDate = new Date(entry.date);
    const isInMonth = entryDate >= startDate && entryDate <= endDate;
    if (!isInMonth) return false;
    
    // Only include completed pomodoro sessions
    // Strictly require completed === true, or if field doesn't exist (old data), require exactly 25 minutes
    if (entry.completed === false) return false; // Explicitly not completed
    if (entry.completed === true) return true; // Explicitly completed
    // For old entries without completed field, only include if exactly 25 minutes (assume completed)
    if (entry.completed == null && entry.minutes === 25) return true;
    
    return false; // Exclude everything else
  });

  // Create a map: date-hour -> { count, totalMinutes }
  const dataMap = {};

  monthEntries.forEach((entry) => {
    const entryDate = new Date(entry.date);
    const date = entryDate.getDate(); // 1-31
    const hour = entry.hour !== undefined ? entry.hour : entryDate.getHours();

    const key = `${date}-${hour}`;
    if (!dataMap[key]) {
      dataMap[key] = { count: 0, totalMinutes: 0 };
    }
    dataMap[key].count += 1;
    dataMap[key].totalMinutes += entry.minutes || 25;
  });

  return {
    year: targetYear,
    month: targetMonth,
    data: dataMap,
  };
};

const User = mongoose.model("User", userSchema);

// Initialize single user if doesn't exist
User.findOne().then((user) => {
  if (!user) {
    new User().save();
  }
});

export default User;
