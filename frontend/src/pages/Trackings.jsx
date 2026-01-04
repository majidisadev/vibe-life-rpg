import { useState, useEffect } from "react";
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
import { Checkbox } from "../components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Plus,
  Trash2,
  Edit,
  TrendingUp,
  TrendingDown,
  Heart,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Moon,
  Zap,
  ShoppingCart,
  Gift,
  Coins,
  X,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import api from "../lib/api";
import { useUser } from "../contexts/UserContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function Trackings() {
  const { refreshUser } = useUser();

  // Helper function to get local date string in YYYY-MM-DD format
  const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Mood state
  const [moods, setMoods] = useState([]);
  const [moodOpen, setMoodOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [existingMoodId, setExistingMoodId] = useState(null);
  const [hoveredMoodId, setHoveredMoodId] = useState(null);
  const [showDeleteMoodDialog, setShowDeleteMoodDialog] = useState(false);
  const [moodToDelete, setMoodToDelete] = useState(null);
  const [showDeleteSleepDialog, setShowDeleteSleepDialog] = useState(false);
  const [showDeleteTransactionDialog, setShowDeleteTransactionDialog] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [moodFormData, setMoodFormData] = useState({
    rating: 3,
    notes: "",
    date: getLocalDateString(),
  });

  // Health state
  const [health, setHealth] = useState([]);
  const [sleepMonth, setSleepMonth] = useState(new Date().getMonth());
  const [sleepYear, setSleepYear] = useState(new Date().getFullYear());
  const [selectedSleepDate, setSelectedSleepDate] = useState(null);
  const [sleepFormData, setSleepFormData] = useState({
    value: "",
  });

  // Finance state
  const [transactions, setTransactions] = useState([]);
  const [budgetOverview, setBudgetOverview] = useState(null);
  const [user, setUser] = useState(null);
  const [financeOpen, setFinanceOpen] = useState(false);
  const [financeChartYear, setFinanceChartYear] = useState(
    new Date().getFullYear()
  );
  const [financeChartMonth, setFinanceChartMonth] = useState(
    new Date().getMonth()
  );
  const [financeChartView, setFinanceChartView] = useState("monthly"); // "yearly", "monthly", "daily"
  const [financeFilterMonth, setFinanceFilterMonth] = useState(null); // null = all months
  const [financeFilterYear, setFinanceFilterYear] = useState(null); // null = all years
  const [financeCurrentPage, setFinanceCurrentPage] = useState(1);
  const [financeItemsPerPage] = useState(10);
  const [financeTotalPages, setFinanceTotalPages] = useState(1);
  const [financeTotalItems, setFinanceTotalItems] = useState(0);
  const [financeFormData, setFinanceFormData] = useState({
    type: "",
    amount: "",
    category: "",
    description: "",
  });
  const [editingTransaction, setEditingTransaction] = useState(null);

  // Wishlist state
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [editingWishlistItem, setEditingWishlistItem] = useState(null);
  const [showDeleteWishlistDialog, setShowDeleteWishlistDialog] = useState(false);
  const [wishlistItemToDelete, setWishlistItemToDelete] = useState(null);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [itemToPurchase, setItemToPurchase] = useState(null);
  const [wishlistFormData, setWishlistFormData] = useState({
    name: "",
    image: "",
    url: "",
    coinPrice: "",
    price: "",
    priority: "medium",
    secondhand: false,
  });

  useEffect(() => {
    loadAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [financeCurrentPage]);

  useEffect(() => {
    if (moodOpen) {
      checkDateMood(selectedDate);
    } else {
      // Reset form when dialog closes
      setExistingMoodId(null);
      setMoodFormData({
        rating: 3,
        notes: "",
        date: selectedDate,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moodOpen, selectedDate]);

  // Update form when moods change and dialog is open
  useEffect(() => {
    if (moodOpen) {
      checkDateMood(selectedDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moods]);

  const loadAllData = async () => {
    try {
      // Load finance with pagination
      const financeParams = new URLSearchParams();
      financeParams.append("page", financeCurrentPage.toString());
      financeParams.append("limit", financeItemsPerPage.toString());
      const financeUrl = `/finance?${financeParams.toString()}`;
      
      const [moodsRes, healthRes, transactionsRes, budgetRes, userRes, wishlistRes] =
        await Promise.all([
          api.get("/mood"),
          api.get("/health"),
          api.get(financeUrl),
          api.get("/finance/budget/overview"),
          api.get("/user"),
          api.get("/wishlist"),
        ]);
      setMoods(moodsRes.data);
      setHealth(healthRes.data);
      
      // Handle finance response with pagination
      if (Array.isArray(transactionsRes.data)) {
        setTransactions(transactionsRes.data);
        setFinanceTotalItems(transactionsRes.data.length);
        setFinanceTotalPages(Math.ceil(transactionsRes.data.length / financeItemsPerPage));
      } else {
        setTransactions(transactionsRes.data.data || []);
        if (transactionsRes.data.pagination) {
          setFinanceTotalItems(transactionsRes.data.pagination.total);
          setFinanceTotalPages(transactionsRes.data.pagination.totalPages);
        }
      }
      
      setBudgetOverview(budgetRes.data);
      setUser(userRes.data);
      setWishlistItems(wishlistRes.data);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  // Mood handlers
  const checkDateMood = (date) => {
    const dateMood = moods.find((mood) => {
      const moodDateObj = new Date(mood.date);
      const moodDate = getLocalDateString(moodDateObj);
      return moodDate === date;
    });

    if (dateMood) {
      setExistingMoodId(dateMood._id);
      setMoodFormData({
        rating: dateMood.rating,
        notes: dateMood.notes || "",
        date: date,
      });
    } else {
      setExistingMoodId(null);
      setMoodFormData({
        rating: 3,
        notes: "",
        date: date,
      });
    }
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setMoodOpen(true);
  };

  const handleMoodSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...moodFormData,
        date: selectedDate,
      };

      if (existingMoodId) {
        // Update existing mood for selected date
        await api.put(`/mood/${existingMoodId}`, submitData);
      } else {
        // Create new mood for selected date
        await api.post("/mood", submitData);
      }
      setMoodOpen(false);
      loadAllData();
    } catch (error) {
      console.error("Error saving mood:", error);
    }
  };

  const handleMoodDelete = (id) => {
    setMoodToDelete(id);
    setShowDeleteMoodDialog(true);
  };

  const confirmMoodDelete = async () => {
    if (moodToDelete) {
      try {
        await api.delete(`/mood/${moodToDelete}`);
        toast.success("Mood entry deleted");
        loadAllData();
      } catch (error) {
        console.error("Error deleting mood:", error);
        toast.error("Error deleting mood entry");
      }
    }
    setShowDeleteMoodDialog(false);
    setMoodToDelete(null);
  };

  const getRatingEmoji = (rating) => {
    const emojis = ["😢", "😕", "😐", "🙂", "😄"];
    return emojis[rating - 1] || "😐";
  };

  const getMoodColor = (rating) => {
    const colors = [
      "bg-gray-600", // Sad - dark grey
      "bg-green-900", // Down - very dark green
      "bg-green-700", // Okay - dark green
      "bg-green-500", // Good - medium green
      "bg-green-400", // Great - light green
    ];
    return colors[rating - 1] || "bg-gray-200";
  };

  const getMoodColorHex = (rating) => {
    const colors = [
      "#4B5563", // Sad - dark grey (gray-600)
      "#14532D", // Down - very dark green (green-900)
      "#15803D", // Okay - dark green (green-700)
      "#22C55E", // Good - medium green (green-500)
      "#4ADE80", // Great - light green (green-400)
    ];
    return colors[rating - 1] || "#E5E7EB";
  };

  const getMoodStats30Days = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const stats = {
      1: 0, // Sad
      2: 0, // Down
      3: 0, // Okay
      4: 0, // Good
      5: 0, // Great
    };

    moods.forEach((mood) => {
      const moodDate = new Date(mood.date);
      if (moodDate >= thirtyDaysAgo && moodDate <= today) {
        stats[mood.rating] = (stats[mood.rating] || 0) + 1;
      }
    });

    const total = Object.values(stats).reduce((sum, count) => sum + count, 0);
    return { stats, total };
  };

  const getMoodForDate = (date) => {
    const dateStr = getLocalDateString(date);
    return moods.find((mood) => {
      const moodDateObj = new Date(mood.date);
      const moodDate = getLocalDateString(moodDateObj);
      return moodDate === dateStr;
    });
  };

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  const navigateMonth = (direction) => {
    if (direction === "prev") {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const monthNames = [
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

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      days.push(date);
    }

    return days;
  };

  const calendarDays = renderCalendar();
  const selectedDateStr = selectedDate;

  // Get sleep entries only
  const sleepEntries = health.filter((entry) => entry.type === "sleep");

  // Get sleep data for a specific date
  const getSleepForDate = (date) => {
    const dateStr = getLocalDateString(date);
    return sleepEntries.find((entry) => {
      const entryDateObj = new Date(entry.date);
      const entryDate = getLocalDateString(entryDateObj);
      return entryDate === dateStr;
    });
  };

  // Sleep handlers
  const navigateSleepMonth = (direction) => {
    if (direction === "prev") {
      if (sleepMonth === 0) {
        setSleepMonth(11);
        setSleepYear(sleepYear - 1);
      } else {
        setSleepMonth(sleepMonth - 1);
      }
    } else {
      if (sleepMonth === 11) {
        setSleepMonth(0);
        setSleepYear(sleepYear + 1);
      } else {
        setSleepMonth(sleepMonth + 1);
      }
    }
  };

  const handleSleepDateClick = (date) => {
    const dateStr = getLocalDateString(date);
    const existingEntry = getSleepForDate(date);

    setSelectedSleepDate(dateStr);
    if (existingEntry) {
      setSleepFormData({
        value: existingEntry.value?.toString() || "",
      });
    } else {
      setSleepFormData({
        value: "",
      });
    }
  };

  const handleSleepSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSleepDate) return;

    try {
      // Validate sleep value (must be integer 1-12)
      const sleepValue = parseFloat(sleepFormData.value);
      if (isNaN(sleepValue) || sleepValue < 1 || sleepValue > 12) {
        toast.error("Invalid Input", {
          description: "Jam tidur harus antara 1-12 jam (bilangan bulat)",
        });
        return;
      }

      // Ensure value is integer (no decimals)
      const intValue = Math.floor(sleepValue);
      if (intValue !== sleepValue) {
        toast.error("Invalid Input", {
          description: "Jam tidur harus bilangan bulat (tidak boleh decimal)",
        });
        return;
      }

      const existingEntry = getSleepForDate(new Date(selectedSleepDate));
      const submitData = {
        type: "sleep",
        value: intValue,
        unit: "hours",
        notes: "",
        date: selectedSleepDate,
      };

      let response;
      if (existingEntry) {
        // Update existing entry
        response = await api.put(`/health/${existingEntry._id}`, submitData);
        toast.success("Sleep entry updated", {
          description: `Sleep duration updated to ${intValue} hours`,
        });
      } else {
        // Create new entry
        response = await api.post("/health", submitData);

        // Check if energy was added (only for new entries)
        const energyAdded = response.data?.energyAdded || 0;
        if (energyAdded === 0) {
          // Only show toast if no energy was added
          toast.success("Sleep entry saved", {
            description: `Recorded ${intValue} hours of sleep`,
          });
        }
        // If energy was added, let UserContext handle the toast notification
      }

      // Refresh user data to update energy in navbar immediately
      // UserContext will show toast for energy changes
      await refreshUser();

      setSelectedSleepDate(null);
      loadAllData();
    } catch (error) {
      console.error("Error saving sleep entry:", error);
      toast.error("Error saving sleep entry", {
        description: error.response?.data?.error || error.message,
      });
    }
  };

  const handleSleepDelete = () => {
    if (!selectedSleepDate) return;

    const existingEntry = getSleepForDate(new Date(selectedSleepDate));
    if (!existingEntry) return;

    setShowDeleteSleepDialog(true);
  };

  const confirmSleepDelete = async () => {
    if (!selectedSleepDate) return;

    const existingEntry = getSleepForDate(new Date(selectedSleepDate));
    if (!existingEntry) return;

    try {
      await api.delete(`/health/${existingEntry._id}`);
      toast.success("Sleep entry deleted");
      setSelectedSleepDate(null);
      loadAllData();
    } catch (error) {
      console.error("Error deleting sleep entry:", error);
      toast.error("Error deleting sleep entry");
    }
    setShowDeleteSleepDialog(false);
  };

  // Get sleep duration for a date (in hours)
  const getSleepDuration = (date) => {
    const sleepEntry = getSleepForDate(date);
    return sleepEntry ? parseFloat(sleepEntry.value) || 0 : 0;
  };

  // Get color for sleep duration (similar to contribution graph)
  // Colors match the image: dark grey (less) to vibrant green (many)
  // Range maksimal: 10 hours
  const getSleepColor = (hours) => {
    if (hours === 0) return "bg-gray-200"; // No data - light grey (less)
    if (hours < 4) return "bg-gray-600"; // Very little - dark grey (less)
    if (hours < 5.5) return "bg-green-900"; // Little - very dark green
    if (hours < 6.5) return "bg-green-700"; // Some - dark green
    if (hours < 7.5) return "bg-green-500"; // Good - medium green
    if (hours < 8.5) return "bg-green-400"; // Better - light green
    if (hours < 10) return "bg-green-300"; // Great - very light green
    return "bg-green-300"; // Max (10+) - very light green (many)
  };

  // Render sleep contribution graph
  const renderSleepGraph = () => {
    const daysInMonth = getDaysInMonth(sleepMonth, sleepYear);
    const firstDay = getFirstDayOfMonth(sleepMonth, sleepYear);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(sleepYear, sleepMonth, day);
      const sleepHours = getSleepDuration(date);
      days.push({ date, sleepHours });
    }

    return { days };
  };

  // Finance handlers
  const handleFinanceSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...financeFormData,
        amount: parseFloat(financeFormData.amount),
        date: new Date(), // Date is set automatically, cannot be edited
      };
      
      if (editingTransaction) {
        await api.put(`/finance/${editingTransaction._id}`, submitData);
      } else {
        await api.post("/finance", submitData);
      }
      
      setFinanceOpen(false);
      setEditingTransaction(null);
      setFinanceFormData({
        type: "",
        amount: "",
        category: "",
        description: "",
      });
      loadAllData();
    } catch (error) {
      console.error("Error saving transaction:", error);
    }
  };

  const handleFinanceEdit = (transaction) => {
    setEditingTransaction(transaction);
    setFinanceFormData({
      type: transaction.type,
      amount: transaction.amount.toString(),
      category: transaction.category || "",
      description: transaction.description || "",
    });
    setFinanceOpen(true);
  };

  const handleFinanceDelete = (id) => {
    setTransactionToDelete(id);
    setShowDeleteTransactionDialog(true);
  };

  const confirmFinanceDelete = async () => {
    if (transactionToDelete) {
      try {
        await api.delete(`/finance/${transactionToDelete}`);
        toast.success("Transaction deleted");
        loadAllData();
      } catch (error) {
        console.error("Error deleting transaction:", error);
        toast.error("Error deleting transaction");
      }
    }
    setShowDeleteTransactionDialog(false);
    setTransactionToDelete(null);
  };

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalOutcomes = transactions
    .filter((t) => t.type === "outcome")
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalOutcomes;

  // Get available years from transactions
  const getAvailableYears = () => {
    const years = new Set();
    transactions.forEach((t) => {
      const year = new Date(t.date).getFullYear();
      years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a);
  };

  // Calculate yearly balances (year to year)
  const getYearlyBalances = () => {
    const yearlyData = [];
    const years = getAvailableYears();

    years.forEach((year) => {
      // Filter transactions up to the end of this year
      const transactionsUpToYear = transactions.filter((t) => {
        const transactionDate = new Date(t.date);
        return transactionDate.getFullYear() <= year;
      });

      const yearIncome = transactionsUpToYear
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);
      const yearOutcomes = transactionsUpToYear
        .filter((t) => t.type === "outcome")
        .reduce((sum, t) => sum + t.amount, 0);
      const yearBalance = yearIncome - yearOutcomes;

      yearlyData.push({
        year: year.toString(),
        balance: parseFloat(yearBalance.toFixed(2)),
      });
    });

    return yearlyData;
  };

  // Calculate monthly balances for the selected year
  const getMonthlyBalances = () => {
    const monthlyData = [];
    const monthNamesShort = [
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

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // Determine the last month to show
    const lastMonthToShow =
      financeChartYear === currentYear ? currentMonth : 11;

    for (let month = 0; month <= lastMonthToShow; month++) {
      // Filter transactions up to the end of this month
      const transactionsUpToMonth = transactions.filter((t) => {
        const transactionDate = new Date(t.date);
        return (
          transactionDate.getFullYear() < financeChartYear ||
          (transactionDate.getFullYear() === financeChartYear &&
            transactionDate.getMonth() <= month)
        );
      });

      const monthIncome = transactionsUpToMonth
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);
      const monthOutcomes = transactionsUpToMonth
        .filter((t) => t.type === "outcome")
        .reduce((sum, t) => sum + t.amount, 0);
      const monthBalance = monthIncome - monthOutcomes;

      monthlyData.push({
        month: monthNamesShort[month],
        balance: parseFloat(monthBalance.toFixed(2)),
      });
    }

    return monthlyData;
  };

  // Calculate daily balances for the selected month
  const getDailyBalances = () => {
    const dailyData = [];
    const daysInMonth = new Date(
      financeChartYear,
      financeChartMonth + 1,
      0
    ).getDate();

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const currentDay = currentDate.getDate();

    // Determine the last day to show
    const lastDayToShow =
      financeChartYear === currentYear &&
      financeChartMonth === currentMonth
        ? currentDay
        : daysInMonth;

    for (let day = 1; day <= lastDayToShow; day++) {
      // Filter transactions up to the end of this day
      const transactionsUpToDay = transactions.filter((t) => {
        const transactionDate = new Date(t.date);
        return (
          transactionDate.getFullYear() < financeChartYear ||
          (transactionDate.getFullYear() === financeChartYear &&
            transactionDate.getMonth() < financeChartMonth) ||
          (transactionDate.getFullYear() === financeChartYear &&
            transactionDate.getMonth() === financeChartMonth &&
            transactionDate.getDate() <= day)
        );
      });

      const dayIncome = transactionsUpToDay
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);
      const dayOutcomes = transactionsUpToDay
        .filter((t) => t.type === "outcome")
        .reduce((sum, t) => sum + t.amount, 0);
      const dayBalance = dayIncome - dayOutcomes;

      dailyData.push({
        day: day.toString(),
        balance: parseFloat(dayBalance.toFixed(2)),
      });
    }

    return dailyData;
  };

  // Get chart data based on view type
  const getChartData = () => {
    switch (financeChartView) {
      case "yearly":
        return getYearlyBalances();
      case "monthly":
        return getMonthlyBalances();
      case "daily":
        return getDailyBalances();
      default:
        return getMonthlyBalances();
    }
  };

  const chartData = getChartData();

  // Filter and paginate transactions
  const getFilteredTransactions = () => {
    let filtered = [...transactions];

    // Filter by year
    if (financeFilterYear !== null) {
      filtered = filtered.filter((t) => {
        const transactionDate = new Date(t.date);
        return transactionDate.getFullYear() === financeFilterYear;
      });
    }

    // Filter by month
    if (financeFilterMonth !== null) {
      filtered = filtered.filter((t) => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === financeFilterMonth;
      });
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    return filtered;
  };

  const filteredTransactions = getFilteredTransactions();
  // Data is already paginated from backend, but we filter client-side
  const paginatedTransactions = filteredTransactions;

  // Calculate category totals for pie chart
  const getCategoryTotals = () => {
    const categoryMap = new Map();

    filteredTransactions.forEach((transaction) => {
      const category = transaction.category || "Uncategorized";
      const currentTotal = categoryMap.get(category) || 0;
      categoryMap.set(category, currentTotal + transaction.amount);
    });

    // Convert to array format for PieChart
    const categoryData = Array.from(categoryMap.entries()).map(([name, value]) => ({
      name,
      value: Math.abs(value), // Use absolute value for pie chart
    }));

    // Sort by value descending
    categoryData.sort((a, b) => b.value - a.value);

    return categoryData;
  };

  const categoryTotals = getCategoryTotals();

  // Generate colors for pie chart
  const COLORS = [
    "#22c55e", // green
    "#ef4444", // red
    "#3b82f6", // blue
    "#f59e0b", // amber
    "#8b5cf6", // purple
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#84cc16", // lime
    "#f97316", // orange
    "#6366f1", // indigo
    "#14b8a6", // teal
    "#a855f7", // violet
  ];

  // Reset to page 1 when filters change
  useEffect(() => {
    setFinanceCurrentPage(1);
  }, [financeFilterMonth, financeFilterYear]);

  const sleepGraph = renderSleepGraph();

  // Image compression function
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;

        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.8);
          resolve(compressedBase64);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  // Wishlist handlers
  const handleWishlistImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image size must be less than 10MB");
        e.target.value = "";
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        e.target.value = "";
        return;
      }

      try {
        const compressedBase64 = await compressImage(file);
        setWishlistFormData({ ...wishlistFormData, image: compressedBase64 });
      } catch (error) {
        console.error("Error processing image:", error);
        toast.error("Error processing image");
      }
    }
  };

  const handleWishlistSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...wishlistFormData,
        coinPrice: wishlistFormData.coinPrice ? parseFloat(wishlistFormData.coinPrice) : 0,
        price: wishlistFormData.price ? parseFloat(wishlistFormData.price) : 0,
      };

      if (editingWishlistItem) {
        await api.put(`/wishlist/${editingWishlistItem._id}`, submitData);
        toast.success("Wishlist item updated");
      } else {
        await api.post("/wishlist", submitData);
        toast.success("Wishlist item added");
      }

      setWishlistOpen(false);
      setEditingWishlistItem(null);
      setWishlistFormData({
        name: "",
        image: "",
        url: "",
        coinPrice: "",
        price: "",
        priority: "medium",
        secondhand: false,
      });
      loadAllData();
    } catch (error) {
      console.error("Error saving wishlist item:", error);
      toast.error("Error saving wishlist item");
    }
  };

  const handleWishlistEdit = (item) => {
    setEditingWishlistItem(item);
    setWishlistFormData({
      name: item.name || "",
      image: item.image || "",
      url: item.url || "",
      coinPrice: item.coinPrice?.toString() || "",
      price: item.price?.toString() || "",
      priority: item.priority || "medium",
      secondhand: item.secondhand || false,
    });
    setWishlistOpen(true);
  };

  const handleWishlistDelete = (id) => {
    setWishlistItemToDelete(id);
    setShowDeleteWishlistDialog(true);
  };

  const confirmWishlistDelete = async () => {
    if (wishlistItemToDelete) {
      try {
        await api.delete(`/wishlist/${wishlistItemToDelete}`);
        toast.success("Wishlist item deleted");
        loadAllData();
      } catch (error) {
        console.error("Error deleting wishlist item:", error);
        toast.error("Error deleting wishlist item");
      }
    }
    setShowDeleteWishlistDialog(false);
    setWishlistItemToDelete(null);
  };

  const handlePurchaseClick = (item) => {
    setItemToPurchase(item);
    setShowPurchaseDialog(true);
  };

  const confirmPurchase = async () => {
    if (!itemToPurchase) return;

    try {
      const response = await api.post(`/wishlist/${itemToPurchase._id}/purchase`);
      
      toast.success("Item purchased successfully!");
      await refreshUser();
      loadAllData();
      setShowPurchaseDialog(false);
      setItemToPurchase(null);
    } catch (error) {
      console.error("Error purchasing item:", error);
      toast.error(error.response?.data?.error || "Error purchasing item");
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  // Tab state for wishlist
  const [wishlistTab, setWishlistTab] = useState("available"); // "available", "unavailable", or "bought"
  
  // Filter items based on tab
  const availableItems = wishlistItems.filter((item) => {
    if (item.purchased) return false;
    // Item is available if user has enough coins AND balance
    const hasEnoughCoins = (user?.coins || 0) >= item.coinPrice;
    const hasEnoughBalance = balance >= item.price;
    return hasEnoughCoins && hasEnoughBalance;
  });
  
  const unavailableItems = wishlistItems.filter((item) => {
    if (item.purchased) return false;
    // Item is unavailable if user doesn't have enough coins OR balance
    const hasEnoughCoins = (user?.coins || 0) >= item.coinPrice;
    const hasEnoughBalance = balance >= item.price;
    return !hasEnoughCoins || !hasEnoughBalance;
  });
  
  const boughtItems = wishlistItems.filter((item) => item.purchased);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Trackings</h1>

      {/* Bento Grid Layout */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-6 auto-rows-auto">
        {/* Mood Tracker - Large Card (3 cols, 2 rows) */}
        <Card className="lg:col-span-3 lg:row-span-2 flex flex-col min-h-[500px]">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-500" />
                <CardTitle>Mood Tracker</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateMonth("prev")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Select
                  value={`${currentMonth}-${currentYear}`}
                  onValueChange={(value) => {
                    const [month, year] = value.split("-").map(Number);
                    setCurrentMonth(month);
                    setCurrentYear(year);
                  }}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue>
                      {monthNames[currentMonth]} {currentYear}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {Array.from({ length: 24 }, (_, i) => {
                      const yearOffset = Math.floor(i / 12);
                      const month = i % 12;
                      const year = currentYear - 1 + yearOffset;
                      return (
                        <SelectItem
                          key={`${month}-${year}`}
                          value={`${month}-${year}`}
                        >
                          {monthNames[month]} {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateMonth("next")}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Dialog open={moodOpen} onOpenChange={setMoodOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="hidden">
                  <Plus className="h-4 w-4 mr-2" />
                  New Entry
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-left font-bold">
                    How was your day?
                  </DialogTitle>
                  <DialogDescription className="text-left">
                    Track your mood to spot patterns
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleMoodSubmit} className="space-y-6">
                  <div>
                    <div className="flex gap-4 justify-center mt-4">
                      {[
                        { rating: 1, label: "Sad", emoji: "😢" },
                        { rating: 2, label: "Down", emoji: "😕" },
                        { rating: 3, label: "Okay", emoji: "😐" },
                        { rating: 4, label: "Good", emoji: "🙂" },
                        { rating: 5, label: "Great", emoji: "😄" },
                      ].map(({ rating, label, emoji }) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() =>
                            setMoodFormData({ ...moodFormData, rating })
                          }
                          className={`flex flex-col items-center gap-2 p-2 rounded transition-all ${
                            moodFormData.rating === rating
                              ? "ring-2 ring-primary scale-105"
                              : "hover:opacity-80"
                          }`}
                        >
                          <span className="text-4xl">{emoji}</span>
                          <span className="text-sm font-medium">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Input
                      id="mood-notes"
                      value={moodFormData.notes}
                      onChange={(e) =>
                        setMoodFormData({
                          ...moodFormData,
                          notes: e.target.value,
                        })
                      }
                      placeholder="Add a note (optional)"
                      className="w-full"
                      maxLength={50}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit">
                      <Save className="h-4 w-4" />
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-7 gap-2">
              {/* Day headers */}
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {calendarDays.map((date, index) => {
                if (!date) {
                  return (
                    <div key={`empty-${index}`} className="aspect-square" />
                  );
                }

                const dateStr = getLocalDateString(date);
                const mood = getMoodForDate(date);
                const isSelected = dateStr === selectedDateStr;
                const isToday = dateStr === getLocalDateString();

                return (
                  <button
                    key={dateStr}
                    onClick={() => handleDateClick(dateStr)}
                    className={`aspect-square flex flex-col items-center justify-center rounded-lg transition-all hover:opacity-80 relative ${
                      isSelected ? "ring-2 ring-green-500" : ""
                    }`}
                  >
                    {mood ? (
                      mood.notes ? (
                        <Popover open={hoveredMoodId === mood._id}>
                          <PopoverTrigger asChild>
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center ${getMoodColor(
                                mood.rating
                              )} mb-1 cursor-pointer`}
                              onMouseEnter={() => setHoveredMoodId(mood._id)}
                              onMouseLeave={() => setHoveredMoodId(null)}
                            >
                              <span className="text-xl">
                                {getRatingEmoji(mood.rating)}
                              </span>
                            </div>
                          </PopoverTrigger>
                          <PopoverContent
                            side="top"
                            className="w-64 p-3"
                            onOpenAutoFocus={(e) => e.preventDefault()}
                            onMouseEnter={() => setHoveredMoodId(mood._id)}
                            onMouseLeave={() => setHoveredMoodId(null)}
                          >
                            <div className="text-sm">
                              <div className="font-medium mb-1">Note:</div>
                              <div className="text-muted-foreground">
                                {mood.notes}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${getMoodColor(
                            mood.rating
                          )} mb-1`}
                        >
                          <span className="text-xl">
                            {getRatingEmoji(mood.rating)}
                          </span>
                        </div>
                      )
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mb-1">
                        <span className="text-gray-400 text-xl">○</span>
                      </div>
                    )}
                    <span
                      className={`text-xs font-medium ${
                        isSelected
                          ? "bg-green-500 text-white rounded px-1.5 py-0.5"
                          : isToday
                          ? "text-primary font-semibold"
                          : ""
                      }`}
                    >
                      {date.getDate()}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Semi Donut Chart - 30 Days Stats */}
            {(() => {
              const { stats, total } = getMoodStats30Days();
              if (total === 0) return null;

              const radius = 60;
              const centerX = 120;
              const centerY = 60;
              const startAngle = -180; // Start from left (semi circle)
              const endAngle = 0; // End at right
              const totalAngle = endAngle - startAngle; // 180 degrees

              const moodLabels = [
                { rating: 1, label: "Sad", emoji: "😢" },
                { rating: 2, label: "Down", emoji: "😕" },
                { rating: 3, label: "Okay", emoji: "😐" },
                { rating: 4, label: "Good", emoji: "🙂" },
                { rating: 5, label: "Great", emoji: "😄" },
              ];

              let currentAngle = startAngle;
              const paths = [];

              moodLabels.forEach(({ rating }) => {
                const count = stats[rating] || 0;
                if (count === 0) return;

                const angle = (count / total) * totalAngle;
                const startAngleRad = (currentAngle * Math.PI) / 180;
                const endAngleRad = ((currentAngle + angle) * Math.PI) / 180;

                const x1 = centerX + radius * Math.cos(startAngleRad);
                const y1 = centerY + radius * Math.sin(startAngleRad);
                const x2 = centerX + radius * Math.cos(endAngleRad);
                const y2 = centerY + radius * Math.sin(endAngleRad);

                const largeArcFlag = angle > 180 ? 1 : 0;

                const pathData = [
                  `M ${centerX} ${centerY}`,
                  `L ${x1} ${y1}`,
                  `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                  "Z",
                ].join(" ");

                paths.push({
                  path: pathData,
                  color: getMoodColorHex(rating),
                  rating,
                  count,
                  percentage: ((count / total) * 100).toFixed(1),
                });

                currentAngle += angle;
              });

              return (
                <div className="mt-6 pt-6 border-t">
                  <div className="text-sm font-medium text-center mb-4">
                    Mood Distribution (Last 30 Days)
                  </div>
                  <div className="flex items-center justify-center gap-8">
                    {/* Chart */}
                    <div className="relative">
                      <svg
                        width="240"
                        height="120"
                        viewBox="0 0 240 120"
                        className="overflow-visible"
                      >
                        {paths.map((item, index) => (
                          <path
                            key={index}
                            d={item.path}
                            fill={item.color}
                            stroke="white"
                            strokeWidth="2"
                            className="hover:opacity-80 transition-opacity"
                          />
                        ))}
                      </svg>
                    </div>

                    {/* Legend */}
                    <div className="space-y-2">
                      {moodLabels.map(({ rating, label, emoji }) => {
                        const count = stats[rating] || 0;
                        if (count === 0) return null;
                        const percentage = ((count / total) * 100).toFixed(1);
                        return (
                          <div
                            key={rating}
                            className="flex items-center gap-2 text-sm"
                          >
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{
                                backgroundColor: getMoodColorHex(rating),
                              }}
                            />
                            <span className="text-lg">{emoji}</span>
                            <span className="font-medium">{label}:</span>
                            <span className="text-muted-foreground">
                              {count} ({percentage}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Sleep Tracker - Medium Card (3 cols, 2 rows) */}
        <Card className="lg:col-span-3 lg:row-span-2 flex flex-col min-h-[500px]">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Moon className="h-5 w-5 text-blue-500" />
                <CardTitle>Sleep Tracker</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateSleepMonth("prev")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Select
                  value={`${sleepMonth}-${sleepYear}`}
                  onValueChange={(value) => {
                    const [month, year] = value.split("-").map(Number);
                    setSleepMonth(month);
                    setSleepYear(year);
                  }}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue>
                      {monthNames[sleepMonth]} {sleepYear}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {Array.from({ length: 24 }, (_, i) => {
                      const yearOffset = Math.floor(i / 12);
                      const month = i % 12;
                      const year = sleepYear - 1 + yearOffset;
                      return (
                        <SelectItem
                          key={`${month}-${year}`}
                          value={`${month}-${year}`}
                        >
                          {monthNames[month]} {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateSleepMonth("next")}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            {/* Sleep Contribution Graph */}
            <div className="space-y-4">
              <div className="grid grid-cols-7 gap-1.5">
                {/* Day headers */}
                {dayNames.map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-medium text-muted-foreground py-1"
                  >
                    {day}
                  </div>
                ))}

                {/* Sleep grid */}
                {sleepGraph.days.map((dayData, index) => {
                  if (!dayData) {
                    return (
                      <div key={`empty-${index}`} className="aspect-square" />
                    );
                  }

                  const { date, sleepHours } = dayData;
                  const dateStr = getLocalDateString(date);
                  const isToday = dateStr === getLocalDateString();
                  const isSelected = dateStr === selectedSleepDate;
                  const sleepEntry = getSleepForDate(date);

                  return (
                    <Popover
                      key={dateStr}
                      open={isSelected}
                      onOpenChange={(open) => {
                        if (!open) {
                          setSelectedSleepDate(null);
                        }
                      }}
                    >
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          onClick={() => handleSleepDateClick(date)}
                          className="relative group cursor-pointer"
                          title={`${date.toLocaleDateString()}: ${
                            sleepHours > 0
                              ? `${sleepHours.toFixed(1)} hours`
                              : "No data"
                          }`}
                        >
                          <div
                            className={`aspect-square rounded-sm transition-all ${getSleepColor(
                              sleepHours
                            )} ${isToday ? "ring-2 ring-blue-500" : ""} ${
                              isSelected ? "ring-2 ring-primary" : ""
                            } hover:opacity-80 hover:scale-105`}
                          />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        side="top"
                        className="w-80 p-4"
                        onOpenAutoFocus={(e) => e.preventDefault()}
                      >
                        <form
                          onSubmit={handleSleepSubmit}
                          className="space-y-4"
                        >
                          <div>
                            <div className="font-medium mb-2">
                              {date.toLocaleDateString("en-US", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="sleep-value">
                              Sleep Duration (hours) *
                            </Label>
                            <Input
                              id="sleep-value"
                              type="number"
                              step="1"
                              min="1"
                              max="12"
                              value={sleepFormData.value}
                              onChange={(e) =>
                                setSleepFormData({
                                  ...sleepFormData,
                                  value: e.target.value,
                                })
                              }
                              placeholder="e.g., 7"
                              required
                              autoFocus
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Button type="submit" className="flex-1">
                              {sleepEntry ? "Update" : "Save"}
                            </Button>
                            {sleepEntry && (
                              <Button
                                type="button"
                                variant="destructive"
                                onClick={handleSleepDelete}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setSelectedSleepDate(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </form>
                      </PopoverContent>
                    </Popover>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>less</span>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-gray-200" />
                  <div className="w-3 h-3 rounded-full bg-gray-600" />
                  <div className="w-3 h-3 rounded-full bg-green-900" />
                  <div className="w-3 h-3 rounded-full bg-green-700" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <div className="w-3 h-3 rounded-full bg-green-300" />
                </div>
                <span>many</span>
              </div>

              {/* Summary Stats */}
              {(() => {
                // Filter sleep entries for the selected month
                const monthSleepEntries = sleepEntries.filter((entry) => {
                  const entryDate = new Date(entry.date);
                  return (
                    entryDate.getMonth() === sleepMonth &&
                    entryDate.getFullYear() === sleepYear
                  );
                });

                if (monthSleepEntries.length === 0) return null;

                const avgSleep =
                  monthSleepEntries.reduce(
                    (sum, entry) => sum + (parseFloat(entry.value) || 0),
                    0
                  ) / monthSleepEntries.length;

                return (
                  <div className="pt-4 border-t">
                    <div className="text-center">
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Avg Sleep
                        </div>
                        <div className="text-lg font-bold">
                          {avgSleep.toFixed(1)} hrs
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </CardContent>
        </Card>

        {/* Finance Summary - Wide Card (Full Width) */}
        <Card className="lg:col-span-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                <CardTitle>Finance Tracker</CardTitle>
              </div>
              <Dialog open={financeOpen} onOpenChange={(open) => {
                setFinanceOpen(open);
                if (!open) {
                  setEditingTransaction(null);
                  setFinanceFormData({
                    type: "",
                    amount: "",
                    category: "",
                    description: "",
                  });
                }
              }}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Transaction
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingTransaction ? "Edit Transaction" : "New Transaction"}
                    </DialogTitle>
                    <DialogDescription>
                      Record income or outcome
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleFinanceSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="finance-type">Type *</Label>
                      <Select
                        value={financeFormData.type}
                        onValueChange={(value) =>
                          setFinanceFormData({
                            ...financeFormData,
                            type: value,
                            category: "", // Reset category when type changes
                          })
                        }
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="income">Income</SelectItem>
                          <SelectItem value="outcome">Outcome</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {financeFormData.type && (
                      <div>
                        <Label htmlFor="finance-category">Category</Label>
                        <Select
                          value={financeFormData.category}
                          onValueChange={(value) =>
                            setFinanceFormData({
                              ...financeFormData,
                              category: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {(() => {
                              const categories = user?.settings?.financeCategories || [];
                              // Normalize categories to new format if needed
                              const normalizedCategories = categories.map(c => 
                                typeof c === 'string' ? { name: c, type: 'income' } : c
                              );
                              return normalizedCategories
                                .filter(c => c.type === financeFormData.type)
                                .map((category) => (
                                  <SelectItem key={`${category.name}-${category.type}`} value={category.name}>
                                    {category.name}
                                  </SelectItem>
                                ));
                            })()}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div>
                      <Label htmlFor="finance-amount">Amount *</Label>
                      <Input
                        id="finance-amount"
                        type="number"
                        step="0.01"
                        value={financeFormData.amount}
                        onChange={(e) =>
                          setFinanceFormData({
                            ...financeFormData,
                            amount: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="finance-description">Description *</Label>
                      <Input
                        id="finance-description"
                        value={financeFormData.description}
                        onChange={(e) =>
                          setFinanceFormData({
                            ...financeFormData,
                            description: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setFinanceOpen(false);
                          setEditingTransaction(null);
                          setFinanceFormData({
                            type: "",
                            amount: "",
                            category: "",
                            description: "",
                          });
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
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <div className="text-sm text-muted-foreground">
                  Total Income
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {user?.settings?.currency || "USD"} {totalIncome.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">
                  Total Outcomes
                </div>
                <div className="text-2xl font-bold text-red-600">
                  {user?.settings?.currency || "USD"} {totalOutcomes.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Balance</div>
                <div
                  className={`text-2xl font-bold ${
                    balance >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {user?.settings?.currency || "USD"} {balance.toFixed(2)}
                </div>
              </div>
              {budgetOverview && (
                <div>
                  <div className="text-sm text-muted-foreground mb-2">
                    Budget Used
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all ${
                          budgetOverview.percentageUsed >= 100
                            ? "bg-red-600"
                            : budgetOverview.percentageUsed >= 80
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                        style={{
                          width: `${Math.min(budgetOverview.percentageUsed, 100)}%`,
                        }}
                      />
                    </div>
                    <div className="text-2xl font-bold">
                      {budgetOverview.percentageUsed.toFixed(1)}%
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Balance Trend Chart */}
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <h3 className="font-semibold">Balance Trend</h3>
                <div className="flex items-center gap-2">
                  {/* Tab Buttons */}
                  <div className="flex items-center gap-1 border rounded-md p-1">
                    <Button
                      variant={
                        financeChartView === "yearly" ? "default" : "ghost"
                      }
                      size="sm"
                      onClick={() => setFinanceChartView("yearly")}
                      className="h-8"
                    >
                      Yearly
                    </Button>
                    <Button
                      variant={
                        financeChartView === "monthly" ? "default" : "ghost"
                      }
                      size="sm"
                      onClick={() => setFinanceChartView("monthly")}
                      className="h-8"
                    >
                      Monthly
                    </Button>
                    <Button
                      variant={
                        financeChartView === "daily" ? "default" : "ghost"
                      }
                      size="sm"
                      onClick={() => setFinanceChartView("daily")}
                      className="h-8"
                    >
                      Daily
                    </Button>
                  </div>
                  {/* Selectors based on view */}
                  {financeChartView === "monthly" && (
                    <Select
                      value={financeChartYear.toString()}
                      onValueChange={(value) =>
                        setFinanceChartYear(parseInt(value))
                      }
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableYears().map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {financeChartView === "daily" && (
                    <>
                      <Select
                        value={financeChartYear.toString()}
                        onValueChange={(value) =>
                          setFinanceChartYear(parseInt(value))
                        }
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableYears().map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={financeChartMonth.toString()}
                        onValueChange={(value) =>
                          setFinanceChartMonth(parseInt(value))
                        }
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(() => {
                            const currentDate = new Date();
                            const currentYear = currentDate.getFullYear();
                            const currentMonth = currentDate.getMonth();
                            
                            // If selected year is current year, only show months up to current month
                            const maxMonth =
                              financeChartYear === currentYear
                                ? currentMonth
                                : 11;
                            
                            return monthNames
                              .slice(0, maxMonth + 1)
                              .map((month, index) => (
                                <SelectItem key={index} value={index.toString()}>
                                  {month}
                                </SelectItem>
                              ));
                          })()}
                        </SelectContent>
                      </Select>
                    </>
                  )}
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey={
                        financeChartView === "yearly"
                          ? "year"
                          : financeChartView === "monthly"
                          ? "month"
                          : "day"
                      }
                      tick={{ fontSize: 12 }}
                      interval={
                        financeChartView === "daily" ? "preserveStartEnd" : 0
                      }
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        const currency = user?.settings?.currency || "USD";
                        if (Math.abs(value) >= 1000) {
                          return `${currency} ${(value / 1000).toFixed(1)}k`;
                        }
                        return `${currency} ${value}`;
                      }}
                    />
                    <Tooltip
                      formatter={(value) => {
                        const currency = user?.settings?.currency || "USD";
                        return [`${currency} ${value.toFixed(2)}`, "Balance"];
                      }}
                      labelStyle={{ color: "#000" }}
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "6px",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="balance"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={{ fill: "#22c55e", r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Current Balance"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-4 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pie Chart Section */}
                <div className="lg:col-span-1">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Category Breakdown</CardTitle>
                      <CardDescription>
                        Total per finance category
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {categoryTotals.length > 0 ? (
                        <div className="w-full">
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={categoryTotals}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) =>
                                  percent > 0.05
                                    ? `${name}: ${(percent * 100).toFixed(0)}%`
                                    : ""
                                }
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {categoryTotals.map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                  />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(value) => {
                                  const currency = user?.settings?.currency || "USD";
                                  return `${currency} ${value.toFixed(2)}`;
                                }}
                                labelStyle={{ color: "#000" }}
                                contentStyle={{
                                  backgroundColor: "#fff",
                                  border: "1px solid #e5e7eb",
                                  borderRadius: "6px",
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="mt-4 space-y-2 max-h-[150px] overflow-y-auto">
                            {categoryTotals.map((item, index) => (
                              <div
                                key={item.name}
                                className="flex items-center justify-between text-sm"
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{
                                      backgroundColor: COLORS[index % COLORS.length],
                                    }}
                                  />
                                  <span className="text-muted-foreground">
                                    {item.name}
                                  </span>
                                </div>
                                <span className="font-medium">
                                  {user?.settings?.currency || "USD"}{" "}
                                  {item.value.toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
                          No transactions found for selected filters
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Transactions Section */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <h3 className="font-semibold">Recent Transactions</h3>
                    <div className="flex items-center gap-2">
                  <Select
                    value={
                      financeFilterYear !== null
                        ? financeFilterYear.toString()
                        : "all"
                    }
                    onValueChange={(value) =>
                      setFinanceFilterYear(
                        value === "all" ? null : parseInt(value)
                      )
                    }
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="All Years" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      {getAvailableYears().map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={
                      financeFilterMonth !== null
                        ? financeFilterMonth.toString()
                        : "all"
                    }
                    onValueChange={(value) =>
                      setFinanceFilterMonth(
                        value === "all" ? null : parseInt(value)
                      )
                    }
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="All Months" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Months</SelectItem>
                      {monthNames.map((month, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {paginatedTransactions.length > 0 ? (
                <>
                  {paginatedTransactions.map((transaction) => (
                  <div
                    key={transaction._id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      {transaction.type === "income" ? (
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-600" />
                      )}
                      <div>
                        <div className="font-medium">
                          {transaction.description || "No description"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {transaction.category && `${transaction.category} • `}
                          {new Date(transaction.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`text-lg font-bold ${
                          transaction.type === "income"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.type === "income" ? "+" : "-"}
                        {user?.settings?.currency || "USD"}{" "}
                        {transaction.amount.toFixed(2)}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleFinanceEdit(transaction)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleFinanceDelete(transaction._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  ))}

                  {/* Pagination */}
                  {financeTotalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="text-sm text-muted-foreground">
                        Showing {((financeCurrentPage - 1) * financeItemsPerPage) + 1} to{" "}
                        {Math.min(financeCurrentPage * financeItemsPerPage, financeTotalItems)} of{" "}
                        {financeTotalItems} transactions
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setFinanceCurrentPage((prev) =>
                              Math.max(1, prev - 1)
                            )
                          }
                          disabled={financeCurrentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <div className="text-sm text-muted-foreground">
                          Page {financeCurrentPage} of {financeTotalPages}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setFinanceCurrentPage((prev) =>
                              Math.min(financeTotalPages, prev + 1)
                            )
                          }
                          disabled={financeCurrentPage === financeTotalPages}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {filteredTransactions.length === 0 &&
                  (financeFilterMonth !== null ||
                    financeFilterYear !== null)
                    ? "No transactions found for selected filters"
                    : "No transactions yet"}
                </p>
              )}
                </div>
              </div>
            </div>

            {/* Wishlist Items Section */}
            <div className="space-y-4 mt-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Gift className="h-5 w-5 text-purple-500" />
                  Wishlist Items
                </h3>
                <Dialog
                  open={wishlistOpen}
                  onOpenChange={(open) => {
                    setWishlistOpen(open);
                    if (!open) {
                      setEditingWishlistItem(null);
                      setWishlistFormData({
                        name: "",
                        image: "",
                        url: "",
                        coinPrice: "",
                        price: "",
                        priority: "medium",
                        secondhand: false,
                      });
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Wishlist Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingWishlistItem ? "Edit Wishlist Item" : "New Wishlist Item"}
                      </DialogTitle>
                      <DialogDescription>
                        Add an item to your wishlist. Purchase requires both coins and real money.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleWishlistSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="wishlist-name">Name *</Label>
                        <Input
                          id="wishlist-name"
                          value={wishlistFormData.name}
                          onChange={(e) =>
                            setWishlistFormData({
                              ...wishlistFormData,
                              name: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="wishlist-image">Image</Label>
                        <Input
                          id="wishlist-image"
                          type="file"
                          accept="image/*"
                          onChange={handleWishlistImageUpload}
                          className="cursor-pointer"
                        />
                        {wishlistFormData.image && (
                          <div className="mt-2">
                            <img
                              src={wishlistFormData.image}
                              alt="Preview"
                              className="w-32 h-32 object-cover rounded border"
                            />
                          </div>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="wishlist-url">URL</Label>
                        <Input
                          id="wishlist-url"
                          type="url"
                          value={wishlistFormData.url}
                          onChange={(e) =>
                            setWishlistFormData({
                              ...wishlistFormData,
                              url: e.target.value,
                            })
                          }
                          placeholder="https://..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="wishlist-coin-price">Coin Price *</Label>
                          <Input
                            id="wishlist-coin-price"
                            type="number"
                            min="0"
                            step="1"
                            value={wishlistFormData.coinPrice}
                            onChange={(e) =>
                              setWishlistFormData({
                                ...wishlistFormData,
                                coinPrice: e.target.value,
                              })
                            }
                            placeholder="0"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="wishlist-price">Real Money Price *</Label>
                          <Input
                            id="wishlist-price"
                            type="number"
                            min="0"
                            step="0.01"
                            value={wishlistFormData.price}
                            onChange={(e) =>
                              setWishlistFormData({
                                ...wishlistFormData,
                                price: e.target.value,
                              })
                            }
                            placeholder="0.00"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="wishlist-priority">Priority</Label>
                        <Select
                          value={wishlistFormData.priority}
                          onValueChange={(value) =>
                            setWishlistFormData({
                              ...wishlistFormData,
                              priority: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="wishlist-secondhand"
                          checked={wishlistFormData.secondhand}
                          onCheckedChange={(checked) =>
                            setWishlistFormData({
                              ...wishlistFormData,
                              secondhand: checked,
                            })
                          }
                        />
                        <Label htmlFor="wishlist-secondhand" className="cursor-pointer">
                          Secondhand
                        </Label>
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setWishlistOpen(false);
                            setEditingWishlistItem(null);
                            setWishlistFormData({
                              name: "",
                              image: "",
                              url: "",
                              coinPrice: "",
                              price: "",
                              priority: "medium",
                              secondhand: false,
                            });
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
              </div>

              {/* Wishlist Tabs */}
              <div className="flex items-center gap-2 border-b">
                <Button
                  variant={wishlistTab === "available" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setWishlistTab("available")}
                  className="rounded-b-none"
                >
                  Available ({availableItems.length})
                </Button>
                <Button
                  variant={wishlistTab === "unavailable" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setWishlistTab("unavailable")}
                  className="rounded-b-none"
                >
                  Unavailable ({unavailableItems.length})
                </Button>
                <Button
                  variant={wishlistTab === "bought" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setWishlistTab("bought")}
                  className="rounded-b-none"
                >
                  Bought Items ({boughtItems.length})
                </Button>
              </div>

              {/* Wishlist Items Grid */}
              {wishlistTab === "available" && (
                <>
                  {availableItems.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {availableItems.map((item) => (
                    <Card key={item._id} className="overflow-hidden">
                      {item.image && (
                        <div className="aspect-video w-full overflow-hidden bg-gray-100">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-lg flex-1">{item.name}</h4>
                          <span
                            className={`px-2 py-1 text-xs rounded-full border ${getPriorityColor(
                              item.priority
                            )}`}
                          >
                            {item.priority}
                          </span>
                        </div>
                        {item.secondhand && (
                          <div className="text-xs text-muted-foreground mb-2">
                            Secondhand
                          </div>
                        )}
                        <div className="space-y-2 mb-4">
                          {item.coinPrice > 0 && (
                            <div className="flex items-center gap-2 text-sm">
                              <Coins className="h-4 w-4 text-yellow-600" />
                              <span className="font-medium">{item.coinPrice} coins</span>
                            </div>
                          )}
                          {item.price > 0 && (
                            <div className="flex items-center gap-2 text-sm">
                              <DollarSign className="h-4 w-4 text-green-600" />
                              <span className="font-medium">
                                {user?.settings?.currency || "USD"} {item.price.toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline mb-2 block"
                          >
                            View Link
                          </a>
                        )}
                        <div className="flex items-center gap-2 mt-4">
                          {item.coinPrice > 0 && item.price > 0 && (
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => handlePurchaseClick(item)}
                              disabled={
                                user?.coins < item.coinPrice || balance < item.price
                              }
                            >
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Buy
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleWishlistEdit(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleWishlistDelete(item._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No available items. Items will appear here when you have enough coins and real money.
                    </p>
                  )}
                </>
              )}

              {/* Unavailable Items Tab */}
              {wishlistTab === "unavailable" && (
                <>
                  {unavailableItems.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {unavailableItems.map((item) => (
                        <Card key={item._id} className="overflow-hidden opacity-75">
                          {item.image && (
                            <div className="aspect-video w-full overflow-hidden bg-gray-100">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-semibold text-lg flex-1">{item.name}</h4>
                              <span
                                className={`px-2 py-1 text-xs rounded-full border ${getPriorityColor(
                                  item.priority
                                )}`}
                              >
                                {item.priority}
                              </span>
                            </div>
                            {item.secondhand && (
                              <div className="text-xs text-muted-foreground mb-2">
                                Secondhand
                              </div>
                            )}
                            <div className="space-y-2 mb-4">
                              {item.coinPrice > 0 && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Coins className="h-4 w-4 text-yellow-600" />
                                  <span className={`font-medium ${(user?.coins || 0) < item.coinPrice ? 'text-red-600' : ''}`}>
                                    {item.coinPrice} coins
                                    {(user?.coins || 0) < item.coinPrice && (
                                      <span className="text-xs ml-1">(Need {item.coinPrice - (user?.coins || 0)} more)</span>
                                    )}
                                  </span>
                                </div>
                              )}
                              {item.price > 0 && (
                                <div className="flex items-center gap-2 text-sm">
                                  <DollarSign className="h-4 w-4 text-green-600" />
                                  <span className={`font-medium ${balance < item.price ? 'text-red-600' : ''}`}>
                                    {user?.settings?.currency || "USD"} {item.price.toFixed(2)}
                                    {balance < item.price && (
                                      <span className="text-xs ml-1">(Need {user?.settings?.currency || "USD"} {(item.price - balance).toFixed(2)} more)</span>
                                    )}
                                  </span>
                                </div>
                              )}
                            </div>
                            {item.url && (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline mb-2 block"
                              >
                                View Link
                              </a>
                            )}
                            <div className="flex items-center gap-2 mt-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleWishlistEdit(item)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleWishlistDelete(item._id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No unavailable items. All items are available for purchase!
                    </p>
                  )}
                </>
              )}

              {/* Bought Items Tab */}
              {wishlistTab === "bought" && (
                <>
                  {boughtItems.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {boughtItems.map((item) => (
                        <Card key={item._id} className="overflow-hidden opacity-75">
                          {item.image && (
                            <div className="aspect-video w-full overflow-hidden bg-gray-100">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-semibold text-lg flex-1">{item.name}</h4>
                              <span
                                className={`px-2 py-1 text-xs rounded-full border ${getPriorityColor(
                                  item.priority
                                )}`}
                              >
                                {item.priority}
                              </span>
                            </div>
                            {item.secondhand && (
                              <div className="text-xs text-muted-foreground mb-2">
                                Secondhand
                              </div>
                            )}
                            <div className="space-y-2 mb-4">
                              {item.coinPrice > 0 && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Coins className="h-4 w-4 text-yellow-600" />
                                  <span className="font-medium">{item.coinPrice} coins</span>
                                </div>
                              )}
                              {item.price > 0 && (
                                <div className="flex items-center gap-2 text-sm">
                                  <DollarSign className="h-4 w-4 text-green-600" />
                                  <span className="font-medium">
                                    {user?.settings?.currency || "USD"} {item.price.toFixed(2)}
                                  </span>
                                </div>
                              )}
                            </div>
                            {item.url && (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline mb-2 block"
                              >
                                View Link
                              </a>
                            )}
                            <div className="text-xs text-muted-foreground mt-2">
                              Purchased on{" "}
                              {item.purchasedAt
                                ? new Date(item.purchasedAt).toLocaleDateString()
                                : "Unknown"}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No purchased items yet.
                    </p>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Delete Mood Confirmation Dialog */}
      <Dialog open={showDeleteMoodDialog} onOpenChange={setShowDeleteMoodDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Mood Entry?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this mood entry? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteMoodDialog(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              onClick={confirmMoodDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Sleep Confirmation Dialog */}
      <Dialog open={showDeleteSleepDialog} onOpenChange={setShowDeleteSleepDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Sleep Entry?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this sleep entry? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteSleepDialog(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              onClick={confirmSleepDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Transaction Confirmation Dialog */}
      <Dialog open={showDeleteTransactionDialog} onOpenChange={setShowDeleteTransactionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Transaction?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteTransactionDialog(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              onClick={confirmFinanceDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Wishlist Item Confirmation Dialog */}
      <Dialog open={showDeleteWishlistDialog} onOpenChange={setShowDeleteWishlistDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Wishlist Item?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this wishlist item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteWishlistDialog(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              onClick={confirmWishlistDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Purchase Confirmation Dialog */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Purchase Item</DialogTitle>
            <DialogDescription>
              Purchase requires both coins and real money
            </DialogDescription>
          </DialogHeader>
          {itemToPurchase && (
            <div className="space-y-4">
              <div>
                <div className="font-medium mb-3">{itemToPurchase.name}</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Coins className="h-4 w-4 text-yellow-600" />
                      <span>Coins:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{itemToPurchase.coinPrice} coins</span>
                      {user?.coins < itemToPurchase.coinPrice ? (
                        <span className="text-red-600 text-xs">(Not enough)</span>
                      ) : (
                        <span className="text-green-600 text-xs">✓</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span>Money:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {user?.settings?.currency || "USD"} {itemToPurchase.price.toFixed(2)}
                      </span>
                      {balance < itemToPurchase.price ? (
                        <span className="text-red-600 text-xs">(Not enough)</span>
                      ) : (
                        <span className="text-green-600 text-xs">✓</span>
                      )}
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="text-xs text-muted-foreground">
                      Total: {itemToPurchase.coinPrice} coins + {user?.settings?.currency || "USD"} {itemToPurchase.price.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
              <Button
                className="w-full"
                onClick={confirmPurchase}
                disabled={
                  !itemToPurchase.coinPrice ||
                  !itemToPurchase.price ||
                  user?.coins < itemToPurchase.coinPrice ||
                  balance < itemToPurchase.price
                }
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Purchase with Both
              </Button>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPurchaseDialog(false);
                setItemToPurchase(null);
              }}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
