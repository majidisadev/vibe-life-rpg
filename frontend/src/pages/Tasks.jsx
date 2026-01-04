import { useState, useEffect, useMemo, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";
import {
  Plus,
  Trash2,
  Check,
  Search,
  Filter,
  Minus,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Pencil,
  X,
  Save,
  PlusCircle,
} from "lucide-react";
import { toast } from "sonner";
import api from "../lib/api";
import { cn } from "../lib/utils";
import { useUser } from "../contexts/UserContext";

// Helper function to check if a task is due
const isTaskDue = (task) => {
  if (task.completed || task.skipped) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!task.startDate) return true; // If no startDate, consider it due

  const startDate = new Date(task.startDate);
  startDate.setHours(0, 0, 0, 0);

  // Task must have started
  if (startDate > today) return false;

  // For daily tasks, it's due if startDate is today or in the past
  if (task.repeatType === "daily") {
    return startDate <= today;
  }

  // For weekly tasks, check if today's day of week is in repeatOn
  if (task.repeatType === "weekly") {
    const repeatOn = task.repeatOn || [];
    if (repeatOn.length === 0) {
      // If no repeatOn specified, treat as every week from startDate
      const daysSinceStart = Math.floor(
        (today - startDate) / (1000 * 60 * 60 * 24)
      );
      return daysSinceStart % (7 * (task.repeatEvery || 1)) === 0;
    }
    // Check if today's day of week (0=Sunday, 6=Saturday) is in repeatOn
    const todayDayOfWeek = today.getDay();
    return repeatOn.includes(todayDayOfWeek);
  }

  // For monthly tasks, check if today's date is in repeatOn
  if (task.repeatType === "monthly") {
    const repeatOn = task.repeatOn || [];
    if (repeatOn.length === 0) {
      // If no repeatOn specified, treat as same date every month
      return today.getDate() === startDate.getDate();
    }
    // Check if today's date (1-31) is in repeatOn
    const todayDate = today.getDate();
    return repeatOn.includes(todayDate);
  }

  // Default: task is due if startDate is today or in the past
  return startDate <= today;
};

// Helper function to check if a task is not due
const isTaskNotDue = (task) => {
  // Task is not due if it's completed or skipped
  if (task.completed || task.skipped) return true;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // If no startDate, consider it due (so not "not due")
  if (!task.startDate) return false;

  const startDate = new Date(task.startDate);
  startDate.setHours(0, 0, 0, 0);

  // Task is not due if startDate is in the future
  if (startDate > today) return true;

  // For weekly tasks, check if today's day of week is NOT in repeatOn
  if (task.repeatType === "weekly") {
    const repeatOn = task.repeatOn || [];
    if (repeatOn.length === 0) {
      // If no repeatOn specified, check if it's the right week interval
      const daysSinceStart = Math.floor(
        (today - startDate) / (1000 * 60 * 60 * 24)
      );
      return daysSinceStart % (7 * (task.repeatEvery || 1)) !== 0;
    }
    // Check if today's day of week is NOT in repeatOn
    const todayDayOfWeek = today.getDay();
    return !repeatOn.includes(todayDayOfWeek);
  }

  // For monthly tasks, check if today's date is NOT in repeatOn
  if (task.repeatType === "monthly") {
    const repeatOn = task.repeatOn || [];
    if (repeatOn.length === 0) {
      // If no repeatOn specified, check if it's the same date
      return today.getDate() !== startDate.getDate();
    }
    // Check if today's date is NOT in repeatOn
    const todayDate = today.getDate();
    return !repeatOn.includes(todayDate);
  }

  // Default: task is not due if startDate is in the future
  return startDate > today;
};

// Helper function to get the next occurrence date for a task
const getNextOccurrenceDate = (task) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!task.startDate) {
    // If no startDate and task is completed/skipped, next is tomorrow
    if (task.completed || task.skipped) {
      const nextDate = new Date(today);
      nextDate.setDate(nextDate.getDate() + 1);
      return nextDate;
    }
    // Otherwise, it's due today
    return today;
  }

  const startDate = new Date(task.startDate);
  startDate.setHours(0, 0, 0, 0);

  // If startDate is in the future, next occurrence is startDate
  if (startDate > today) {
    return startDate;
  }

  // If task is not completed/skipped and is due today, next occurrence is today
  if (!task.completed && !task.skipped && isTaskDue(task)) {
    return today;
  }

  // Calculate next occurrence based on repeatType
  if (task.repeatType === "daily") {
    const nextDate = new Date(today);
    nextDate.setDate(nextDate.getDate() + (task.repeatEvery || 1));
    return nextDate;
  }

  if (task.repeatType === "weekly") {
    const repeatOn = task.repeatOn || [];
    const repeatEvery = task.repeatEvery || 1;

    if (repeatOn.length === 0) {
      // If no repeatOn specified, next is after repeatEvery weeks
      const nextDate = new Date(today);
      nextDate.setDate(nextDate.getDate() + 7 * repeatEvery);
      return nextDate;
    }

    // Find next day of week in repeatOn
    const todayDayOfWeek = today.getDay();
    const sortedRepeatOn = [...repeatOn].sort((a, b) => a - b);

    // Check if there's a day later this week
    for (const day of sortedRepeatOn) {
      if (day > todayDayOfWeek) {
        const nextDate = new Date(today);
        const daysUntil = day - todayDayOfWeek;
        nextDate.setDate(nextDate.getDate() + daysUntil);
        return nextDate;
      }
    }

    // If no day found this week, get first day of next week cycle
    const firstDay = sortedRepeatOn[0];
    const nextDate = new Date(today);

    // Calculate days until next cycle's first day
    // Days until next Sunday (or wrap around)
    const daysUntilNextSunday = (7 - todayDayOfWeek) % 7;
    const daysToFirstDay = firstDay === 0 ? 0 : firstDay;

    // Total: days to next Sunday + (repeatEvery - 1) full weeks + days to first day
    const totalDays =
      daysUntilNextSunday + (repeatEvery - 1) * 7 + daysToFirstDay;
    nextDate.setDate(nextDate.getDate() + totalDays);

    return nextDate;
  }

  if (task.repeatType === "monthly") {
    const repeatOn = task.repeatOn || [];
    const repeatEvery = task.repeatEvery || 1;

    if (repeatOn.length === 0) {
      // If no repeatOn specified, next is same date next month
      const nextDate = new Date(today);
      nextDate.setMonth(nextDate.getMonth() + repeatEvery);
      // Handle case where target date doesn't exist (e.g., Jan 31 -> Feb 31)
      const targetDate = startDate.getDate();
      const lastDayOfMonth = new Date(
        nextDate.getFullYear(),
        nextDate.getMonth() + 1,
        0
      ).getDate();
      nextDate.setDate(Math.min(targetDate, lastDayOfMonth));
      return nextDate;
    }

    // Find next date in repeatOn
    const todayDate = today.getDate();
    const sortedRepeatOn = [...repeatOn].sort((a, b) => a - b);

    // Check if there's a date later this month
    for (const date of sortedRepeatOn) {
      if (date > todayDate) {
        const nextDate = new Date(today);
        const lastDayOfMonth = new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          0
        ).getDate();
        if (date <= lastDayOfMonth) {
          nextDate.setDate(date);
          return nextDate;
        }
      }
    }

    // If no date found this month, get first date of next month cycle
    const nextDate = new Date(today);
    nextDate.setMonth(nextDate.getMonth() + repeatEvery);
    nextDate.setDate(1); // Start of month

    const firstDate = sortedRepeatOn[0];
    const lastDayOfMonth = new Date(
      nextDate.getFullYear(),
      nextDate.getMonth() + 1,
      0
    ).getDate();
    nextDate.setDate(Math.min(firstDate, lastDayOfMonth));
    return nextDate;
  }

  // Default: next is tomorrow
  const nextDate = new Date(today);
  nextDate.setDate(nextDate.getDate() + 1);
  return nextDate;
};

// Helper function to format date for display
const formatDate = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const taskDate = new Date(date);
  taskDate.setHours(0, 0, 0, 0);

  const diffTime = taskDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Tomorrow";
  } else if (diffDays > 1 && diffDays <= 7) {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[taskDate.getDay()];
  } else {
    // Format: MMM DD, YYYY
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${
      months[taskDate.getMonth()]
    } ${taskDate.getDate()}, ${taskDate.getFullYear()}`;
  }
};

export default function Tasks() {
  // Data states
  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState([]);
  const [missions, setMissions] = useState([]);
  const [showDeleteTaskDialog, setShowDeleteTaskDialog] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [showDeleteHabitDialog, setShowDeleteHabitDialog] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState(null);
  const [showDeleteMissionDialog, setShowDeleteMissionDialog] = useState(false);
  const [missionToDelete, setMissionToDelete] = useState(null);
  const { user, refreshUser } = useUser();

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [habitFilter, setHabitFilter] = useState("all"); // all, positive, negative, both
  const [dailyFilter, setDailyFilter] = useState("all"); // all, due, notDue
  const [missionFilter, setMissionFilter] = useState("active"); // active, scheduled, complete

  // Dialog states
  const [openTaskDialog, setOpenTaskDialog] = useState(false);
  const [openHabitDialog, setOpenHabitDialog] = useState(false);
  const [openMissionDialog, setOpenMissionDialog] = useState(false);
  const [openTagFilterDialog, setOpenTagFilterDialog] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editingHabit, setEditingHabit] = useState(null);
  const [editingMission, setEditingMission] = useState(null);

  // Form states
  const [taskFormData, setTaskFormData] = useState({
    title: "",
    description: "",
    checklist: [],
    difficulty: "easy",
    startDate: new Date().toISOString().split("T")[0],
    repeatType: "daily",
    repeatEvery: 1,
    repeatOn: [],
    tags: [],
  });

  const [habitFormData, setHabitFormData] = useState({
    title: "",
    description: "",
    type: "positive",
    difficulty: "easy",
    tags: [],
    resetCounter: "daily",
  });

  const [missionFormData, setMissionFormData] = useState({
    title: "",
    description: "",
    checklist: [],
    difficulty: "easy",
    dueDate: "",
    tags: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tasksRes, habitsRes, missionsRes, newUser] = await Promise.all([
        api.get("/tasks"),
        api.get("/habits"),
        api.get("/missions"),
        refreshUser(), // Use context refreshUser instead of direct API call
      ]);
      // Convert old checklist format (array of strings) to new format (array of objects)
      const tasks = tasksRes.data.map((task) => {
        if (task.checklist && task.checklist.length > 0) {
          const checklist = task.checklist.map((item) => {
            if (typeof item === "string") {
              return { text: item, checked: false };
            }
            return item;
          });
          return { ...task, checklist };
        }
        return task;
      });
      setTasks(tasks);
      setHabits(habitsRes.data);
      // Convert old checklist format (array of strings) to new format (array of objects)
      const missions = missionsRes.data.map((mission) => {
        if (mission.checklist && mission.checklist.length > 0) {
          const checklist = mission.checklist.map((item) => {
            if (typeof item === "string") {
              return { text: item, checked: false };
            }
            // Ensure object has both text and checked properties
            if (item && typeof item === "object") {
              return {
                text: item.text || String(item) || "",
                checked: item.checked === true,
              };
            }
            return { text: String(item), checked: false };
          });
          return { ...mission, checklist };
        }
        return mission;
      });
      setMissions(missions);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  // Filter functions
  const availableTags = user?.settings?.tags || [];

  const filterBySearch = (items) => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.title?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
    );
  };

  const filterByTags = (items) => {
    if (selectedTags.length === 0) return items;
    return items.filter(
      (item) => item.tags && item.tags.some((tag) => selectedTags.includes(tag))
    );
  };

  // Filtered data
  const filteredHabits = useMemo(() => {
    let filtered = [...habits];
    filtered = filterBySearch(filtered);
    filtered = filterByTags(filtered);

    if (habitFilter === "positive") {
      filtered = filtered.filter((h) => h.type === "positive");
    } else if (habitFilter === "negative") {
      filtered = filtered.filter((h) => h.type === "negative");
    } else if (habitFilter === "both") {
      filtered = filtered.filter((h) => h.type === "both");
    }

    return filtered;
  }, [habits, searchQuery, selectedTags, habitFilter]);

  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];
    filtered = filterBySearch(filtered);
    filtered = filterByTags(filtered);

    if (dailyFilter === "due") {
      filtered = filtered.filter((task) => isTaskDue(task));
    } else if (dailyFilter === "notDue") {
      filtered = filtered.filter((task) => isTaskNotDue(task));
    }

    return filtered;
  }, [tasks, searchQuery, selectedTags, dailyFilter]);

  const filteredMissions = useMemo(() => {
    let filtered = [...missions];
    filtered = filterBySearch(filtered);
    filtered = filterByTags(filtered);

    if (missionFilter === "active") {
      filtered = filtered.filter((m) => !m.completed);
    } else if (missionFilter === "complete") {
      filtered = filtered.filter((m) => m.completed);
    } else if (missionFilter === "scheduled") {
      filtered = filtered.filter((m) => m.dueDate && !m.completed);
    }

    return filtered;
  }, [missions, searchQuery, selectedTags, missionFilter]);

  // Task handlers
  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    try {
      // Ensure checklist is in the correct format
      const checklist = taskFormData.checklist.map((item) => {
        if (typeof item === "string") {
          return { text: item, checked: false };
        }
        return { text: item.text || "", checked: item.checked || false };
      });
      const formData = {
        ...taskFormData,
        checklist: checklist,
      };
      if (editingTask) {
        await api.put(`/tasks/${editingTask._id}`, formData);
      } else {
        await api.post("/tasks", formData);
      }
      setOpenTaskDialog(false);
      setEditingTask(null);
      resetTaskForm();
      loadData();
    } catch (error) {
      console.error("Error saving task:", error);
    }
  };

  const handleTaskDelete = (id) => {
    setTaskToDelete(id);
    setShowDeleteTaskDialog(true);
  };

  const confirmTaskDelete = async () => {
    if (taskToDelete) {
      try {
        await api.delete(`/tasks/${taskToDelete}`);
        toast.success("Task deleted");
        loadData();
      } catch (error) {
        console.error("Error deleting task:", error);
        toast.error("Error deleting task");
      }
    }
    setShowDeleteTaskDialog(false);
    setTaskToDelete(null);
  };

  const handleTaskComplete = async (task) => {
    try {
      await api.post(`/tasks/${task._id}/complete`);
      loadData();
    } catch (error) {
      console.error("Error completing task:", error);
    }
  };

  const handleTaskSkip = async (task) => {
    try {
      await api.post(`/tasks/${task._id}/skip`);
      loadData();
    } catch (error) {
      console.error("Error skipping task:", error);
    }
  };

  const handleTaskMoveToTop = async (id) => {
    try {
      await api.post(`/tasks/${id}/move-to-top`);
      loadData();
    } catch (error) {
      console.error("Error moving task to top:", error);
    }
  };

  const handleTaskMoveToBottom = async (id) => {
    try {
      await api.post(`/tasks/${id}/move-to-bottom`);
      loadData();
    } catch (error) {
      console.error("Error moving task to bottom:", error);
    }
  };

  const handleTaskReorder = async (taskIds) => {
    try {
      await api.post("/tasks/reorder", { taskIds });
      loadData();
    } catch (error) {
      console.error("Error reordering tasks:", error);
    }
  };

  const handleChecklistToggle = async (taskId, index) => {
    try {
      await api.post(`/tasks/${taskId}/checklist/${index}/toggle`);
      loadData();
    } catch (error) {
      console.error("Error toggling checklist item:", error);
    }
  };

  const handleMissionChecklistToggle = async (missionId, index) => {
    try {
      await api.post(`/missions/${missionId}/checklist/${index}/toggle`);
      loadData();
    } catch (error) {
      console.error("Error toggling mission checklist item:", error);
    }
  };

  const openTaskEditDialog = (task) => {
    setEditingTask(task);
    // Convert checklist to new format if needed
    const checklist = (task.checklist || []).map((item) => {
      if (typeof item === "string") {
        return { text: item, checked: false };
      }
      return { text: item.text || "", checked: item.checked || false };
    });
    setTaskFormData({
      title: task.title,
      description: task.description || "",
      checklist: checklist,
      difficulty: task.difficulty,
      startDate: task.startDate
        ? new Date(task.startDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      repeatType: task.repeatType || "daily",
      repeatEvery: task.repeatEvery || 1,
      repeatOn: task.repeatOn || [],
      tags: task.tags || [],
    });
    setOpenTaskDialog(true);
  };

  const resetTaskForm = () => {
    setTaskFormData({
      title: "",
      description: "",
      checklist: [],
      difficulty: "easy",
      startDate: new Date().toISOString().split("T")[0],
      repeatType: "daily",
      repeatEvery: 1,
      repeatOn: [],
      tags: [],
    });
  };

  // Habit handlers
  const handleHabitSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingHabit) {
        await api.put(`/habits/${editingHabit._id}`, habitFormData);
      } else {
        await api.post("/habits", habitFormData);
      }
      setOpenHabitDialog(false);
      setEditingHabit(null);
      resetHabitForm();
      loadData();
    } catch (error) {
      console.error("Error saving habit:", error);
    }
  };

  const handleHabitDelete = (id) => {
    setHabitToDelete(id);
    setShowDeleteHabitDialog(true);
  };

  const confirmHabitDelete = async () => {
    if (habitToDelete) {
      try {
        await api.delete(`/habits/${habitToDelete}`);
        toast.success("Habit deleted");
        loadData();
      } catch (error) {
        console.error("Error deleting habit:", error);
        toast.error("Error deleting habit");
      }
    }
    setShowDeleteHabitDialog(false);
    setHabitToDelete(null);
  };

  const handleHabitRecord = async (habit, action) => {
    try {
      await api.post(`/habits/${habit._id}/record`, { action });
      loadData();
    } catch (error) {
      console.error("Error recording habit:", error);
    }
  };

  const handleHabitMoveToTop = async (id) => {
    try {
      await api.post(`/habits/${id}/move-to-top`);
      loadData();
    } catch (error) {
      console.error("Error moving habit to top:", error);
    }
  };

  const handleHabitMoveToBottom = async (id) => {
    try {
      await api.post(`/habits/${id}/move-to-bottom`);
      loadData();
    } catch (error) {
      console.error("Error moving habit to bottom:", error);
    }
  };

  const handleHabitReorder = async (habitIds) => {
    try {
      await api.post("/habits/reorder", { habitIds });
      loadData();
    } catch (error) {
      console.error("Error reordering habits:", error);
    }
  };

  // Drag and drop handlers
  const [draggedHabit, setDraggedHabit] = useState(null);
  const [draggedTask, setDraggedTask] = useState(null);
  const [draggedMission, setDraggedMission] = useState(null);

  const handleDragStart = (e, habit) => {
    setDraggedHabit(habit);
    setDraggedTask(null);
    setDraggedMission(null);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("type", "habit");
  };

  const handleDragOver = (e, type) => {
    e.preventDefault();
    // Only allow drop if the dragged item type matches the target type
    if (type === "habit" && draggedHabit) {
      e.dataTransfer.dropEffect = "move";
    } else if (type === "task" && draggedTask) {
      e.dataTransfer.dropEffect = "move";
    } else if (type === "mission" && draggedMission) {
      e.dataTransfer.dropEffect = "move";
    } else {
      e.dataTransfer.dropEffect = "none";
    }
  };

  const handleDragEnd = () => {
    setDraggedHabit(null);
    setDraggedTask(null);
    setDraggedMission(null);
  };

  const handleDrop = async (e, targetHabit) => {
    e.preventDefault();
    // Only allow drop if dragging a habit
    if (!draggedHabit || draggedHabit._id === targetHabit._id) {
      setDraggedHabit(null);
      return;
    }

    // Use all habits (not filtered) for proper reordering
    const currentOrder = [...habits].sort(
      (a, b) => (a.order || 0) - (b.order || 0)
    );
    const draggedIndex = currentOrder.findIndex(
      (h) => h._id === draggedHabit._id
    );
    const targetIndex = currentOrder.findIndex(
      (h) => h._id === targetHabit._id
    );

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedHabit(null);
      return;
    }

    // Reorder array
    const newOrder = [...currentOrder];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, removed);

    // Update order and call API
    const habitIds = newOrder.map((h) => h._id);
    await handleHabitReorder(habitIds);
    setDraggedHabit(null);
  };

  const handleTaskDragStart = (e, task) => {
    setDraggedTask(task);
    setDraggedHabit(null);
    setDraggedMission(null);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("type", "task");
  };

  const handleTaskDrop = async (e, targetTask) => {
    e.preventDefault();
    // Only allow drop if dragging a task
    if (!draggedTask || draggedTask._id === targetTask._id) {
      setDraggedTask(null);
      return;
    }

    // Use all tasks (not filtered) for proper reordering
    const currentOrder = [...tasks].sort(
      (a, b) => (a.order || 0) - (b.order || 0)
    );
    const draggedIndex = currentOrder.findIndex(
      (t) => t._id === draggedTask._id
    );
    const targetIndex = currentOrder.findIndex((t) => t._id === targetTask._id);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedTask(null);
      return;
    }

    // Reorder array
    const newOrder = [...currentOrder];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, removed);

    // Update order and call API
    const taskIds = newOrder.map((t) => t._id);
    await handleTaskReorder(taskIds);
    setDraggedTask(null);
  };

  const handleMissionDragStart = (e, mission) => {
    setDraggedMission(mission);
    setDraggedHabit(null);
    setDraggedTask(null);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("type", "mission");
  };

  const handleMissionDrop = async (e, targetMission) => {
    e.preventDefault();
    // Only allow drop if dragging a mission
    if (!draggedMission || draggedMission._id === targetMission._id) {
      setDraggedMission(null);
      return;
    }

    // Use all missions (not filtered) for proper reordering
    const currentOrder = [...missions].sort(
      (a, b) => (a.order || 0) - (b.order || 0)
    );
    const draggedIndex = currentOrder.findIndex(
      (m) => m._id === draggedMission._id
    );
    const targetIndex = currentOrder.findIndex(
      (m) => m._id === targetMission._id
    );

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedMission(null);
      return;
    }

    // Reorder array
    const newOrder = [...currentOrder];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, removed);

    // Update order and call API
    const missionIds = newOrder.map((m) => m._id);
    await handleMissionReorder(missionIds);
    setDraggedMission(null);
  };

  const openHabitEditDialog = (habit) => {
    setEditingHabit(habit);
    setHabitFormData({
      title: habit.title,
      description: habit.description || "",
      type: habit.type,
      difficulty: habit.difficulty,
      tags: habit.tags || [],
      resetCounter: habit.resetCounter || "daily",
    });
    setOpenHabitDialog(true);
  };

  const resetHabitForm = () => {
    setHabitFormData({
      title: "",
      description: "",
      type: "positive",
      difficulty: "easy",
      tags: [],
      resetCounter: "daily",
    });
  };

  // Mission handlers
  const handleMissionSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMission) {
        await api.put(`/missions/${editingMission._id}`, missionFormData);
      } else {
        await api.post("/missions", missionFormData);
      }
      setOpenMissionDialog(false);
      setEditingMission(null);
      resetMissionForm();
      loadData();
    } catch (error) {
      console.error("Error saving mission:", error);
    }
  };

  const handleMissionDelete = (id) => {
    setMissionToDelete(id);
    setShowDeleteMissionDialog(true);
  };

  const confirmMissionDelete = async () => {
    if (missionToDelete) {
      try {
        await api.delete(`/missions/${missionToDelete}`);
        toast.success("Mission deleted");
        loadData();
      } catch (error) {
        console.error("Error deleting mission:", error);
        toast.error("Error deleting mission");
      }
    }
    setShowDeleteMissionDialog(false);
    setMissionToDelete(null);
  };

  const handleMissionComplete = async (mission) => {
    try {
      await api.post(`/missions/${mission._id}/complete`);
      loadData();
    } catch (error) {
      console.error("Error completing mission:", error);
    }
  };

  const handleMissionMoveToTop = async (id) => {
    try {
      await api.post(`/missions/${id}/move-to-top`);
      loadData();
    } catch (error) {
      console.error("Error moving mission to top:", error);
    }
  };

  const handleMissionMoveToBottom = async (id) => {
    try {
      await api.post(`/missions/${id}/move-to-bottom`);
      loadData();
    } catch (error) {
      console.error("Error moving mission to bottom:", error);
    }
  };

  const handleMissionReorder = async (missionIds) => {
    try {
      await api.post("/missions/reorder", { missionIds });
      loadData();
    } catch (error) {
      console.error("Error reordering missions:", error);
    }
  };

  const openMissionEditDialog = (mission) => {
    setEditingMission(mission);
    setMissionFormData({
      title: mission.title,
      description: mission.description || "",
      checklist: mission.checklist || [],
      difficulty: mission.difficulty,
      dueDate: mission.dueDate
        ? new Date(mission.dueDate).toISOString().split("T")[0]
        : "",
      tags: mission.tags || [],
    });
    setOpenMissionDialog(true);
  };

  const resetMissionForm = () => {
    setMissionFormData({
      title: "",
      description: "",
      checklist: [],
      difficulty: "easy",
      dueDate: "",
      tags: [],
    });
  };

  // Checklist helpers
  const addChecklistItem = (type) => {
    if (type === "task") {
      setTaskFormData({
        ...taskFormData,
        checklist: [...taskFormData.checklist, { text: "", checked: false }],
      });
    } else if (type === "mission") {
      setMissionFormData({
        ...missionFormData,
        checklist: [...missionFormData.checklist, { text: "", checked: false }],
      });
    }
  };

  const updateChecklistItem = (type, index, value) => {
    if (type === "task") {
      const newChecklist = [...taskFormData.checklist];
      // Handle both old (string) and new (object) format
      if (typeof newChecklist[index] === "string") {
        newChecklist[index] = { text: value, checked: false };
      } else {
        newChecklist[index] = {
          ...newChecklist[index],
          text: value,
        };
      }
      setTaskFormData({ ...taskFormData, checklist: newChecklist });
    } else if (type === "mission") {
      const newChecklist = [...missionFormData.checklist];
      // Handle both old (string) and new (object) format
      if (typeof newChecklist[index] === "string") {
        newChecklist[index] = { text: value, checked: false };
      } else {
        newChecklist[index] = {
          ...newChecklist[index],
          text: value,
        };
      }
      setMissionFormData({ ...missionFormData, checklist: newChecklist });
    }
  };

  const removeChecklistItem = (type, index) => {
    if (type === "task") {
      const newChecklist = taskFormData.checklist.filter((_, i) => i !== index);
      setTaskFormData({ ...taskFormData, checklist: newChecklist });
    } else if (type === "mission") {
      const newChecklist = missionFormData.checklist.filter(
        (_, i) => i !== index
      );
      setMissionFormData({ ...missionFormData, checklist: newChecklist });
    }
  };

  const getDueCount = () => {
    return tasks.filter((t) => isTaskDue(t)).length;
  };

  const getMissionCount = () => {
    return missions.filter((m) => !m.completed).length;
  };

  // Get habit counter display
  const getHabitCounter = (habit) => {
    if (!habit.entries || habit.entries.length === 0) {
      if (habit.type === "positive") return "+0";
      if (habit.type === "negative") return "-0";
      if (habit.type === "both") return "+0 | -0";
    }

    const positiveCount = habit.entries.filter((e) => e.value === 1).length;
    const negativeCount = habit.entries.filter((e) => e.value === -1).length;

    if (habit.type === "positive") {
      return `+${positiveCount}`;
    } else if (habit.type === "negative") {
      return `-${negativeCount}`;
    } else if (habit.type === "both") {
      return `+${positiveCount} | -${negativeCount}`;
    }
    return "0";
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and Tags */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Popover
          open={openTagFilterDialog}
          onOpenChange={setOpenTagFilterDialog}
        >
          <PopoverTrigger asChild>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Tags
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-3">
              <div className="font-semibold text-sm">Filter by Tags</div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableTags.map((tag) => (
                  <div key={tag} className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedTags.includes(tag)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedTags([...selectedTags, tag]);
                        } else {
                          setSelectedTags(
                            selectedTags.filter((t) => t !== tag)
                          );
                        }
                      }}
                    />
                    <Label className="text-sm">{tag}</Label>
                  </div>
                ))}
                {availableTags.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No tags available
                  </p>
                )}
              </div>
              {selectedTags.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setSelectedTags([])}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Task Dialog */}
      <Dialog open={openTaskDialog} onOpenChange={setOpenTaskDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? "Edit Daily Task" : "New Daily Task"}
            </DialogTitle>
            <DialogDescription>
              Create a daily task with rewards
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTaskSubmit} className="space-y-4">
            <div>
              <Label htmlFor="task-title">Title *</Label>
              <Input
                id="task-title"
                value={taskFormData.title}
                onChange={(e) =>
                  setTaskFormData({ ...taskFormData, title: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="task-description">Description</Label>
              <Input
                id="task-description"
                value={taskFormData.description}
                onChange={(e) =>
                  setTaskFormData({
                    ...taskFormData,
                    description: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label className="mb-2">Checklist Items</Label>
              {taskFormData.checklist.map((item, index) => {
                const itemText =
                  typeof item === "string" ? item : item.text || "";
                return (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={itemText}
                      onChange={(e) =>
                        updateChecklistItem("task", index, e.target.value)
                      }
                      placeholder="Checklist item"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => removeChecklistItem("task", index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => addChecklistItem("task")}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div>
              <Label htmlFor="task-difficulty">Difficulty *</Label>
              <Select
                value={taskFormData.difficulty}
                onValueChange={(value) =>
                  setTaskFormData({ ...taskFormData, difficulty: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="task-startDate">Start Date</Label>
              <Input
                id="task-startDate"
                type="date"
                value={taskFormData.startDate}
                onChange={(e) =>
                  setTaskFormData({
                    ...taskFormData,
                    startDate: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="task-repeatType">Repeat Type</Label>
              <Select
                value={taskFormData.repeatType}
                onValueChange={(value) =>
                  setTaskFormData({ ...taskFormData, repeatType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {taskFormData.repeatType === "weekly" && (
              <div>
                <Label>Repeat On (Days of Week)</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Sunday",
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                  ].map((day, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Checkbox
                        checked={taskFormData.repeatOn.includes(index)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setTaskFormData({
                              ...taskFormData,
                              repeatOn: [...taskFormData.repeatOn, index],
                            });
                          } else {
                            setTaskFormData({
                              ...taskFormData,
                              repeatOn: taskFormData.repeatOn.filter(
                                (d) => d !== index
                              ),
                            });
                          }
                        }}
                      />
                      <Label>{day}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {taskFormData.repeatType === "monthly" && (
              <div>
                <Label>Repeat On (Dates 1-31)</Label>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((date) => (
                    <div key={date} className="flex items-center space-x-2">
                      <Checkbox
                        checked={taskFormData.repeatOn.includes(date)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setTaskFormData({
                              ...taskFormData,
                              repeatOn: [...taskFormData.repeatOn, date],
                            });
                          } else {
                            setTaskFormData({
                              ...taskFormData,
                              repeatOn: taskFormData.repeatOn.filter(
                                (d) => d !== date
                              ),
                            });
                          }
                        }}
                      />
                      <Label>{date}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <div key={tag} className="flex items-center space-x-2">
                    <Checkbox
                      checked={taskFormData.tags.includes(tag)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setTaskFormData({
                            ...taskFormData,
                            tags: [...taskFormData.tags, tag],
                          });
                        } else {
                          setTaskFormData({
                            ...taskFormData,
                            tags: taskFormData.tags.filter((t) => t !== tag),
                          });
                        }
                      }}
                    />
                    <Label>{tag}</Label>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpenTaskDialog(false);
                  resetTaskForm();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4" />
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Habits Column */}
        <div
          className="space-y-4"
          onDragOver={(e) => {
            e.preventDefault();
            // Only allow drop if dragging a habit
            if (draggedHabit) {
              e.dataTransfer.dropEffect = "move";
            } else {
              e.dataTransfer.dropEffect = "none";
            }
          }}
        >
          <div>
            <h2 className="text-xl font-bold mb-2">Habits</h2>
            <div className="flex gap-2 mb-4">
              <Button
                variant={habitFilter === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => setHabitFilter("all")}
                className={cn(
                  habitFilter === "all" && "underline underline-offset-4"
                )}
              >
                All
              </Button>
              <Button
                variant={habitFilter === "positive" ? "default" : "ghost"}
                size="sm"
                onClick={() => setHabitFilter("positive")}
                className={cn(
                  habitFilter === "positive" && "underline underline-offset-4"
                )}
              >
                Positive
              </Button>
              <Button
                variant={habitFilter === "negative" ? "default" : "ghost"}
                size="sm"
                onClick={() => setHabitFilter("negative")}
                className={cn(
                  habitFilter === "negative" && "underline underline-offset-4"
                )}
              >
                Negative
              </Button>
              <Button
                variant={habitFilter === "both" ? "default" : "ghost"}
                size="sm"
                onClick={() => setHabitFilter("both")}
                className={cn(
                  habitFilter === "both" && "underline underline-offset-4"
                )}
              >
                Both
              </Button>
            </div>
          </div>
          <Card
            className="bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
            onClick={() => {
              setEditingHabit(null);
              resetHabitForm();
              setOpenHabitDialog(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              // Only allow drop if dragging a habit
              if (draggedHabit) {
                e.dataTransfer.dropEffect = "move";
              } else {
                e.dataTransfer.dropEffect = "none";
              }
            }}
          >
            <CardContent className="p-4 text-center text-muted-foreground flex items-center justify-center">
              <PlusCircle className="h-6 w-6" />
            </CardContent>
          </Card>
          {filteredHabits.map((habit, index) => (
            <Card
              key={habit._id}
              draggable
              onDragStart={(e) => handleDragStart(e, habit)}
              onDragOver={(e) => handleDragOver(e, "habit")}
              onDragEnd={handleDragEnd}
              onDrop={(e) => handleDrop(e, habit)}
              className={cn(
                "cursor-move transition-opacity",
                draggedHabit?._id === habit._id && "opacity-50"
              )}
            >
              <CardHeader>
                <div className="flex items-start gap-3">
                  <GripVertical className="h-5 w-5 text-muted-foreground mt-1 cursor-grab" />
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                      habit.type === "positive"
                        ? "bg-green-500"
                        : habit.type === "negative"
                        ? "bg-red-500"
                        : "bg-blue-500"
                    )}
                  >
                    {habit.type === "positive" ? (
                      <Plus className="h-4 w-4 text-white" />
                    ) : habit.type === "negative" ? (
                      <Minus className="h-4 w-4 text-white" />
                    ) : (
                      <div className="flex gap-0.5">
                        <Plus className="h-3 w-3 text-white" />
                        <Minus className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base">{habit.title}</CardTitle>
                    {habit.description && (
                      <CardDescription className="text-xs mt-1">
                        {habit.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex gap-2">
                      {(habit.type === "positive" || habit.type === "both") && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleHabitRecord(habit, "positive")}
                          className="h-8 border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700 dark:border-green-400 dark:text-green-400 dark:hover:bg-green-900/20"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      )}
                      {(habit.type === "negative" || habit.type === "both") && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleHabitRecord(habit, "negative")}
                          className="h-8 border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-900/20"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-xs px-2 py-1 rounded capitalize font-medium",
                          habit.difficulty === "easy" &&
                            "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                          habit.difficulty === "medium" &&
                            "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
                          habit.difficulty === "hard" &&
                            "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        )}
                      >
                        {habit.difficulty}
                      </span>
                      {habit.tags && habit.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {habit.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-xs px-2 py-1 bg-muted rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <ChevronRight className="h-3 w-3" />
                    {getHabitCounter(habit)}
                  </div>
                </div>
                <div className="flex justify-end gap-1 mt-2 pt-2 border-t">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      openHabitEditDialog(habit);
                    }}
                    title="Edit"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleHabitDelete(habit._id);
                    }}
                    title="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleHabitMoveToTop(habit._id);
                    }}
                    title="Move to top"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleHabitMoveToBottom(habit._id);
                    }}
                    title="Move to bottom"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Dailies Column */}
        <div
          className="space-y-4"
          onDragOver={(e) => {
            e.preventDefault();
            // Only allow drop if dragging a task
            if (draggedTask) {
              e.dataTransfer.dropEffect = "move";
            } else {
              e.dataTransfer.dropEffect = "none";
            }
          }}
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-xl font-bold">Dailies</h2>
              {getDueCount() > 0 && (
                <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {getDueCount()}
                </span>
              )}
            </div>
            <div className="flex gap-2 mb-4">
              <Button
                variant={dailyFilter === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => setDailyFilter("all")}
                className={cn(
                  dailyFilter === "all" && "underline underline-offset-4"
                )}
              >
                All
              </Button>
              <Button
                variant={dailyFilter === "due" ? "default" : "ghost"}
                size="sm"
                onClick={() => setDailyFilter("due")}
                className={cn(
                  dailyFilter === "due" && "underline underline-offset-4"
                )}
              >
                Due
              </Button>
              <Button
                variant={dailyFilter === "notDue" ? "default" : "ghost"}
                size="sm"
                onClick={() => setDailyFilter("notDue")}
                className={cn(
                  dailyFilter === "notDue" && "underline underline-offset-4"
                )}
              >
                Not Due
              </Button>
            </div>
          </div>
          <Card
            className="bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
            onClick={() => {
              setEditingTask(null);
              resetTaskForm();
              setOpenTaskDialog(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              // Only allow drop if dragging a task
              if (draggedTask) {
                e.dataTransfer.dropEffect = "move";
              } else {
                e.dataTransfer.dropEffect = "none";
              }
            }}
          >
            <CardContent className="p-4 text-center text-muted-foreground flex items-center justify-center">
              <PlusCircle className="h-6 w-6" />
            </CardContent>
          </Card>
          {filteredTasks.map((task) => (
            <Card
              key={task._id}
              draggable
              onDragStart={(e) => handleTaskDragStart(e, task)}
              onDragOver={(e) => handleDragOver(e, "task")}
              onDragEnd={handleDragEnd}
              onDrop={(e) => handleTaskDrop(e, task)}
              className={cn(
                "cursor-move transition-opacity",
                draggedTask?._id === task._id && "opacity-50"
              )}
            >
              <CardHeader>
                <div className="flex items-start gap-3">
                  <GripVertical className="h-5 w-5 text-muted-foreground mt-1 cursor-grab" />
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className={cn(
                        "w-8 h-8 rounded flex items-center justify-center flex-shrink-0 p-0 transition-colors",
                        task.completed
                          ? "bg-green-500"
                          : "bg-gray-300 hover:bg-green-500"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!task.completed && !task.skipped) {
                          handleTaskComplete(task);
                        }
                      }}
                      title={task.completed ? "Completed" : "Complete"}
                      disabled={task.completed || task.skipped}
                    >
                      {task.completed ? (
                        <Check className="h-4 w-4 text-white" />
                      ) : (
                        <div className="w-4 h-4 border-2 border-white rounded" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className={cn(
                        "w-8 h-8 rounded flex items-center justify-center flex-shrink-0 p-0 transition-colors",
                        task.skipped
                          ? "bg-red-500"
                          : "bg-gray-300 hover:bg-red-500"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!task.skipped && !task.completed) {
                          handleTaskSkip(task);
                        }
                      }}
                      title={task.skipped ? "Skipped" : "Won't do"}
                      disabled={task.completed || task.skipped}
                    >
                      <X className="h-4 w-4 text-white" />
                    </Button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base">{task.title}</CardTitle>
                    {task.description && (
                      <CardDescription className="text-xs mt-1">
                        {task.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {task.checklist && task.checklist.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {task.checklist.map((item, index) => {
                      const itemText =
                        typeof item === "string" ? item : item.text || "";
                      const itemChecked =
                        typeof item === "string"
                          ? false
                          : item.checked || false;
                      return (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Checkbox
                            checked={itemChecked}
                            onCheckedChange={() => {
                              handleChecklistToggle(task._id, index);
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <label
                            className={cn(
                              "flex-1 cursor-pointer",
                              itemChecked &&
                                "line-through text-muted-foreground"
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleChecklistToggle(task._id, index);
                            }}
                          >
                            {itemText}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={cn(
                        "text-xs px-2 py-1 rounded capitalize font-medium",
                        task.difficulty === "easy" &&
                          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                        task.difficulty === "medium" &&
                          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
                        task.difficulty === "hard" &&
                          "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      )}
                    >
                      {task.difficulty}
                    </span>
                    {task.tags && task.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {task.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-1 bg-muted rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      Next: {formatDate(getNextOccurrenceDate(task))}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          openTaskEditDialog(task);
                        }}
                        title="Edit"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTaskDelete(task._id);
                        }}
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTaskMoveToTop(task._id);
                        }}
                        title="Move to top"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTaskMoveToBottom(task._id);
                        }}
                        title="Move to bottom"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Missions Column */}
        <div
          className="space-y-4"
          onDragOver={(e) => {
            e.preventDefault();
            // Only allow drop if dragging a mission
            if (draggedMission) {
              e.dataTransfer.dropEffect = "move";
            } else {
              e.dataTransfer.dropEffect = "none";
            }
          }}
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-xl font-bold">Missions</h2>
              {getMissionCount() > 0 && (
                <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {getMissionCount()}
                </span>
              )}
            </div>
            <div className="flex gap-2 mb-4">
              <Button
                variant={missionFilter === "active" ? "default" : "ghost"}
                size="sm"
                onClick={() => setMissionFilter("active")}
                className={cn(
                  missionFilter === "active" && "underline underline-offset-4"
                )}
              >
                Active
              </Button>
              <Button
                variant={missionFilter === "scheduled" ? "default" : "ghost"}
                size="sm"
                onClick={() => setMissionFilter("scheduled")}
                className={cn(
                  missionFilter === "scheduled" &&
                    "underline underline-offset-4"
                )}
              >
                Scheduled
              </Button>
              <Button
                variant={missionFilter === "complete" ? "default" : "ghost"}
                size="sm"
                onClick={() => setMissionFilter("complete")}
                className={cn(
                  missionFilter === "complete" && "underline underline-offset-4"
                )}
              >
                Complete
              </Button>
            </div>
          </div>
          <Card
            className="bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
            onClick={() => {
              setEditingMission(null);
              resetMissionForm();
              setOpenMissionDialog(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              // Only allow drop if dragging a mission
              if (draggedMission) {
                e.dataTransfer.dropEffect = "move";
              } else {
                e.dataTransfer.dropEffect = "none";
              }
            }}
          >
            <CardContent className="p-4 text-center text-muted-foreground flex items-center justify-center">
              <PlusCircle className="h-6 w-6" />
            </CardContent>
          </Card>
          {filteredMissions.map((mission) => (
            <Card
              key={mission._id}
              draggable
              onDragStart={(e) => handleMissionDragStart(e, mission)}
              onDragOver={(e) => handleDragOver(e, "mission")}
              onDragEnd={handleDragEnd}
              onDrop={(e) => handleMissionDrop(e, mission)}
              className={cn(
                "cursor-move transition-opacity",
                draggedMission?._id === mission._id && "opacity-50"
              )}
            >
              <CardHeader>
                <div className="flex items-start gap-3">
                  <GripVertical className="h-5 w-5 text-muted-foreground mt-1 cursor-grab" />
                  <Button
                    size="icon"
                    variant="ghost"
                    className={cn(
                      "w-8 h-8 rounded flex items-center justify-center flex-shrink-0 p-0 transition-colors",
                      mission.completed
                        ? "bg-green-500"
                        : "bg-gray-300 hover:bg-green-500"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!mission.completed) {
                        handleMissionComplete(mission);
                      }
                    }}
                    title={mission.completed ? "Completed" : "Complete"}
                    disabled={mission.completed}
                  >
                    {mission.completed ? (
                      <Check className="h-4 w-4 text-white" />
                    ) : (
                      <div className="w-4 h-4 border-2 border-white rounded" />
                    )}
                  </Button>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base">{mission.title}</CardTitle>
                    {mission.description && (
                      <CardDescription className="text-xs mt-1">
                        {mission.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {mission.checklist && mission.checklist.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {mission.checklist.map((item, index) => {
                      // Handle both old (string) and new (object) format
                      const itemText =
                        typeof item === "string"
                          ? item
                          : item?.text || item?.toString() || "";
                      const itemChecked =
                        typeof item === "string"
                          ? false
                          : item?.checked === true;
                      return (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Checkbox
                            checked={itemChecked}
                            onCheckedChange={(checked) => {
                              handleMissionChecklistToggle(mission._id, index);
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <label
                            className={cn(
                              "flex-1 cursor-pointer",
                              itemChecked &&
                                "line-through text-muted-foreground"
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMissionChecklistToggle(mission._id, index);
                            }}
                          >
                            {itemText}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={cn(
                        "text-xs px-2 py-1 rounded capitalize font-medium",
                        mission.difficulty === "easy" &&
                          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                        mission.difficulty === "medium" &&
                          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
                        mission.difficulty === "hard" &&
                          "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      )}
                    >
                      {mission.difficulty}
                    </span>
                    {mission.tags && mission.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {mission.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-1 bg-muted rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    {mission.dueDate && (
                      <div className="text-xs text-muted-foreground">
                        Due: {formatDate(new Date(mission.dueDate))}
                      </div>
                    )}
                    <div className="flex gap-1 ml-auto">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          openMissionEditDialog(mission);
                        }}
                        title="Edit"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMissionDelete(mission._id);
                        }}
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMissionMoveToTop(mission._id);
                        }}
                        title="Move to top"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMissionMoveToBottom(mission._id);
                        }}
                        title="Move to bottom"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Habit Dialog */}
      <Dialog open={openHabitDialog} onOpenChange={setOpenHabitDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingHabit ? "Edit Habit" : "New Habit"}
            </DialogTitle>
            <DialogDescription>
              Track your habits with streak system
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleHabitSubmit} className="space-y-4">
            <div>
              <Label htmlFor="habit-title">Title *</Label>
              <Input
                id="habit-title"
                value={habitFormData.title}
                onChange={(e) =>
                  setHabitFormData({ ...habitFormData, title: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="habit-description">Description</Label>
              <Input
                id="habit-description"
                value={habitFormData.description}
                onChange={(e) =>
                  setHabitFormData({
                    ...habitFormData,
                    description: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="habit-type">Type *</Label>
              <Select
                value={habitFormData.type}
                onValueChange={(value) =>
                  setHabitFormData({ ...habitFormData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="negative">Negative</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="habit-difficulty">Difficulty *</Label>
              <Select
                value={habitFormData.difficulty}
                onValueChange={(value) =>
                  setHabitFormData({ ...habitFormData, difficulty: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="habit-resetCounter">Reset Counter</Label>
              <Select
                value={habitFormData.resetCounter}
                onValueChange={(value) =>
                  setHabitFormData({ ...habitFormData, resetCounter: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <div key={tag} className="flex items-center space-x-2">
                    <Checkbox
                      checked={habitFormData.tags.includes(tag)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setHabitFormData({
                            ...habitFormData,
                            tags: [...habitFormData.tags, tag],
                          });
                        } else {
                          setHabitFormData({
                            ...habitFormData,
                            tags: habitFormData.tags.filter((t) => t !== tag),
                          });
                        }
                      }}
                    />
                    <Label>{tag}</Label>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpenHabitDialog(false);
                  resetHabitForm();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4" />
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Mission Dialog */}
      <Dialog open={openMissionDialog} onOpenChange={setOpenMissionDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMission ? "Edit Mission" : "New Mission"}
            </DialogTitle>
            <DialogDescription>
              Create a long-term mission objective
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleMissionSubmit} className="space-y-4">
            <div>
              <Label htmlFor="mission-title">Title *</Label>
              <Input
                id="mission-title"
                value={missionFormData.title}
                onChange={(e) =>
                  setMissionFormData({
                    ...missionFormData,
                    title: e.target.value,
                  })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="mission-description">Description</Label>
              <Input
                id="mission-description"
                value={missionFormData.description}
                onChange={(e) =>
                  setMissionFormData({
                    ...missionFormData,
                    description: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label>Checklist Items</Label>
              {missionFormData.checklist.map((item, index) => {
                const itemText =
                  typeof item === "string" ? item : item.text || "";
                return (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={itemText}
                      onChange={(e) =>
                        updateChecklistItem("mission", index, e.target.value)
                      }
                      placeholder="Checklist item"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => removeChecklistItem("mission", index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => addChecklistItem("mission")}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div>
              <Label htmlFor="mission-difficulty">Difficulty *</Label>
              <Select
                value={missionFormData.difficulty}
                onValueChange={(value) =>
                  setMissionFormData({ ...missionFormData, difficulty: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="mission-dueDate">Due Date (Optional)</Label>
              <Input
                id="mission-dueDate"
                type="date"
                value={missionFormData.dueDate}
                onChange={(e) =>
                  setMissionFormData({
                    ...missionFormData,
                    dueDate: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <div key={tag} className="flex items-center space-x-2">
                    <Checkbox
                      checked={missionFormData.tags.includes(tag)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setMissionFormData({
                            ...missionFormData,
                            tags: [...missionFormData.tags, tag],
                          });
                        } else {
                          setMissionFormData({
                            ...missionFormData,
                            tags: missionFormData.tags.filter((t) => t !== tag),
                          });
                        }
                      }}
                    />
                    <Label>{tag}</Label>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpenMissionDialog(false);
                  resetMissionForm();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4" />
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Task Confirmation Dialog */}
      <Dialog open={showDeleteTaskDialog} onOpenChange={setShowDeleteTaskDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteTaskDialog(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              onClick={confirmTaskDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Habit Confirmation Dialog */}
      <Dialog open={showDeleteHabitDialog} onOpenChange={setShowDeleteHabitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Habit?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this habit? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteHabitDialog(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              onClick={confirmHabitDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Mission Confirmation Dialog */}
      <Dialog open={showDeleteMissionDialog} onOpenChange={setShowDeleteMissionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Mission?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this mission? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteMissionDialog(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              onClick={confirmMissionDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
