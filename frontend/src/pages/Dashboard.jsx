import { useState, useEffect, useRef } from "react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { toast } from "sonner";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Eye,
  EyeOff,
  Plus,
  Play,
  Pause,
  Upload,
  Trash2,
  User,
  Coins,
  Zap,
  Award,
  Sparkles,
  Pencil,
  Square,
  Smile,
  Moon,
  ChevronLeft,
  ChevronRight,
  Calendar,
  ChevronUp,
  ChevronDown,
  Building2,
  X,
  Save,
} from "lucide-react";
import api from "../lib/api";
import { useUser } from "../contexts/UserContext";

export default function Dashboard() {
  const { user, refreshUser } = useUser();
  const [localUser, setLocalUser] = useState(null);
  const [finance, setFinance] = useState([]);
  const [currentMood, setCurrentMood] = useState(null);
  const [yesterdaySleep, setYesterdaySleep] = useState(null);
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isRest, setIsRest] = useState(false);
  const [initialPomodoroTime, setInitialPomodoroTime] = useState(25 * 60); // Track initial time to calculate elapsed
  const [showMoney, setShowMoney] = useState(false);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [showProfilePictureDialog, setShowProfilePictureDialog] =
    useState(false);
  const [showDeleteProfilePictureDialog, setShowDeleteProfilePictureDialog] =
    useState(false);
  const nameInputRef = useRef(null);
  const [pomodoroProgress, setPomodoroProgress] = useState({
    todayMinutes: 0,
    yesterdayMinutes: 0,
    streak: 0,
    dailyGoal: 60,
    completed: 0,
    progress: 0,
  });
  const [isEditingDailyGoal, setIsEditingDailyGoal] = useState(false);
  const [tempDailyGoal, setTempDailyGoal] = useState(60);
  const [monthlyPomodoroData, setMonthlyPomodoroData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [hoveredCell, setHoveredCell] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showMonthlyStatsDialog, setShowMonthlyStatsDialog] = useState(false);
  const heatmapScrollRef = useRef(null);
  const [showBuildingAllocationDialog, setShowBuildingAllocationDialog] = useState(false);
  const [buildingsInProgress, setBuildingsInProgress] = useState([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState(null);
  const [buildPowerToAllocate, setBuildPowerToAllocate] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadMonthlyData();
  }, [selectedMonth, selectedYear]);

  const loadMonthlyData = async () => {
    try {
      const res = await api.get(`/user/pomodoro/monthly?year=${selectedYear}&month=${selectedMonth}`);
      setMonthlyPomodoroData(res.data);
    } catch (error) {
      console.error("Error loading monthly pomodoro data:", error);
    }
  };

  // Sync profilePicturePreview with user.profilePicture
  useEffect(() => {
    const currentUser = user || localUser;
    if (currentUser?.profilePicture) {
      setProfilePicturePreview(currentUser.profilePicture);
    } else if (currentUser && !currentUser.profilePicture) {
      setProfilePicturePreview(null);
    }
  }, [user?.profilePicture, localUser?.profilePicture]);

  useEffect(() => {
    let interval = null;
    if (isRunning && pomodoroTime > 0) {
      interval = setInterval(() => {
        setPomodoroTime((time) => time - 1);
      }, 1000);
    } else if (pomodoroTime === 0) {
      if (!isRest) {
        // Switch to rest
        setIsRest(true);
        setPomodoroTime(5 * 60); // 5 minutes rest
        setInitialPomodoroTime(5 * 60);
        setIsRunning(false);
      } else {
        // Complete pomodoro
        completePomodoro(25);
        setIsRest(false);
        setPomodoroTime(25 * 60);
        setInitialPomodoroTime(25 * 60);
        setIsRunning(false);
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, pomodoroTime, isRest]);

  const loadData = async () => {
    try {
      const [financeRes, progressRes, moodsRes, healthRes] = await Promise.all([
        api.get("/finance"),
        api.get("/user/pomodoro/progress"),
        api.get("/mood"),
        api.get("/health"),
      ]);
      // Use user from context if available, otherwise load it
      const currentUser = user || (await refreshUser());
      if (currentUser) {
        setLocalUser(currentUser);
        setShowMoney(currentUser?.settings?.showRealMoney || false);
        setProfilePicturePreview(currentUser?.profilePicture || null);
        setTempName(currentUser?.name || "");
      }
      // Handle finance response with pagination (backend returns { data: [...], pagination: {...} })
      setFinance(Array.isArray(financeRes.data) ? financeRes.data : (financeRes.data?.data || []));
      setPomodoroProgress(progressRes.data);
      setTempDailyGoal(progressRes.data.dailyGoal || 60);

      // Get today's mood
      const todayStr = getLocalDateString();
      const todayMood = moodsRes.data.find((mood) => {
        const moodDateObj = new Date(mood.date);
        const moodDateStr = getLocalDateString(moodDateObj);
        return moodDateStr === todayStr;
      });
      setCurrentMood(todayMood || null);

      // Get yesterday's sleep
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = getLocalDateString(yesterday);

      const yesterdaySleepEntry = healthRes.data.find((health) => {
        if (health.type !== "sleep") return false;
        const healthDateObj = new Date(health.date);
        const healthDateStr = getLocalDateString(healthDateObj);
        return healthDateStr === yesterdayStr;
      });
      setYesterdaySleep(yesterdaySleepEntry || null);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const loadBuildingsInProgress = async () => {
    try {
      const res = await api.get("/buildings");
      const buildings = res.data || [];
      // Filter buildings that are in progress (buildProgress > 0 && !built)
      const inProgress = buildings.filter(
        (b) => b.buildProgress > 0 && !b.built
      );
      setBuildingsInProgress(inProgress);
      return inProgress;
    } catch (error) {
      console.error("Error loading buildings:", error);
      return [];
    }
  };

  const completePomodoro = async (minutes = 25) => {
    try {
      const now = new Date();
      const hour = now.getHours();
      const response = await api.post("/user/pomodoro", { minutes, hour });
      const { xpAdded, leveledUp } = response.data;
      
      // Show toast notification for XP gain (only when timer completes automatically)
      if (xpAdded) {
        if (leveledUp) {
          toast.success(`Level Up!`, {
            description: `You gained ${xpAdded} XP and leveled up!`,
          });
        } else {
          toast.success(`Pomodoro Completed!`, {
            description: `You gained ${xpAdded} XP`,
          });
        }
      }
      
      await loadData();
      // Refresh user to show stat changes
      await refreshUser();
      // Reload monthly data
      await loadMonthlyData();

      // Check for buildings in progress
      const inProgress = await loadBuildingsInProgress();
      if (inProgress.length > 0) {
        // 1 pomodoro session (25 min) = 25 build power
        setBuildPowerToAllocate(25);
        setSelectedBuildingId(inProgress[0]._id);
        setShowBuildingAllocationDialog(true);
      }
    } catch (error) {
      console.error("Error completing pomodoro:", error);
      toast.error("Error completing pomodoro", {
        description: "There was an error saving your pomodoro session.",
      });
    }
  };

  const stopPomodoro = () => {
    setIsRunning(false);
    // Reset timer without saving or giving XP (manual stop)
    setIsRest(false);
    setPomodoroTime(25 * 60);
    setInitialPomodoroTime(25 * 60);
  };

  const handleDailyGoalEdit = () => {
    setIsEditingDailyGoal(true);
    setTempDailyGoal(pomodoroProgress.dailyGoal);
  };

  const handleDailyGoalSave = async () => {
    if (tempDailyGoal >= 0 && tempDailyGoal <= 480) {
      try {
        const currentUser = user || localUser;
        await updateUser({
          settings: {
            ...currentUser.settings,
            pomodoroDailyGoal: tempDailyGoal,
          },
        });
        loadData();
      } catch (error) {
        console.error("Error updating daily goal:", error);
      }
    }
    setIsEditingDailyGoal(false);
  };

  const handleDailyGoalCancel = () => {
    setTempDailyGoal(pomodoroProgress.dailyGoal);
    setIsEditingDailyGoal(false);
  };

  const updateUser = async (data) => {
    try {
      const res = await api.put("/user", data);
      setLocalUser(res.data);
      // Update profile picture preview immediately
      if (data.profilePicture !== undefined) {
        if (data.profilePicture) {
          setProfilePicturePreview(data.profilePicture);
        } else {
          setProfilePicturePreview(null);
        }
      }
      // Refresh user context to sync changes
      await refreshUser();
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Error updating profile", {
        description: "Please try again.",
      });
    }
  };

  const compressImage = (
    file,
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.8
  ) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to base64 with compression
          const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
          resolve(compressedBase64);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 10MB before compression)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image size must be less than 10MB");
        e.target.value = ""; // Reset input
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        e.target.value = ""; // Reset input
        return;
      }

      try {
        // Compress image before converting to base64
        const compressedBase64 = await compressImage(file);

        // Update preview immediately for instant feedback
        setProfilePicturePreview(compressedBase64);
        // Close dialog after a short delay to show the preview
        setTimeout(() => {
          setShowProfilePictureDialog(false);
        }, 300);
        // Then update user in background
        await updateUser({ profilePicture: compressedBase64 });
        toast.success("Profile picture updated!");
      } catch (error) {
        console.error("Error processing image:", error);
        toast.error("Error processing image", {
          description: "Please try again.",
        });
        e.target.value = ""; // Reset input
      }
    }
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const handleDeleteProfilePicture = () => {
    setShowDeleteProfilePictureDialog(true);
  };

  const confirmDeleteProfilePicture = () => {
    updateUser({ profilePicture: "" });
    setProfilePicturePreview(null);
    setShowProfilePictureDialog(false);
    setShowDeleteProfilePictureDialog(false);
    toast.success("Profile picture deleted");
  };

  const handleNameEdit = () => {
    setIsEditingName(true);
    const currentUser = user || localUser;
    setTempName(currentUser?.name || "");
    setTimeout(() => {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }, 0);
  };

  const handleNameSave = () => {
    const currentUser = user || localUser;
    if (tempName.trim() && tempName !== currentUser?.name) {
      updateUser({ name: tempName.trim() });
    } else {
      setTempName(currentUser?.name || "");
    }
    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    const currentUser = user || localUser;
    setTempName(currentUser?.name || "");
    setIsEditingName(false);
  };

  const handleProfilePictureClick = () => {
    setShowProfilePictureDialog(true);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const getXPForNextLevel = (level) => {
    return 100 * Math.pow(2, level);
  };

  const getRatingEmoji = (rating) => {
    const emojis = ["😢", "😕", "😐", "🙂", "😄"];
    return emojis[rating - 1] || "😐";
  };

  const getMoodLabel = (rating) => {
    const labels = ["Very Sad", "Sad", "Neutral", "Happy", "Very Happy"];
    return labels[rating - 1] || "Neutral";
  };

  const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const totalIncome = (Array.isArray(finance) ? finance : [])
    .filter((f) => f.type === "income")
    .reduce((sum, f) => sum + f.amount, 0);
  const totalOutcomes = (Array.isArray(finance) ? finance : [])
    .filter((f) => f.type === "outcome")
    .reduce((sum, f) => sum + f.amount, 0);
  const realMoney = totalIncome - totalOutcomes;

  const currentUser = user || localUser;
  if (!currentUser) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Profile Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div
                className="relative cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleProfilePictureClick}
                title="Click to change profile picture"
              >
                {profilePicturePreview ? (
                  <img
                    src={profilePicturePreview}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover border-2 border-primary"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border-2 border-primary">
                    <User className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                {isEditingName ? (
                  <Input
                    ref={nameInputRef}
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onBlur={handleNameSave}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleNameSave();
                      } else if (e.key === "Escape") {
                        handleNameCancel();
                      }
                    }}
                    className="text-3xl font-bold h-auto py-1 px-2"
                  />
                ) : (
                  <CardTitle
                    className="text-3xl cursor-pointer hover:text-primary transition-colors"
                    onClick={handleNameEdit}
                    title="Click to edit name"
                  >
                    {currentUser.name}
                  </CardTitle>
                )}
                <CardDescription className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  <span>Level {currentUser.level}</span>
                  <span>•</span>
                  <Sparkles className="h-4 w-4" />
                  <span>
                    {currentUser.xp} / {getXPForNextLevel(currentUser.level)} XP
                  </span>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 text-2xl font-bold">
                  <Coins className="h-5 w-5" />
                  {currentUser.coins}
                </div>
                <div className="text-sm text-muted-foreground">Coins</div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-2xl font-bold">
                  <Zap className="h-5 w-5" />
                  {currentUser.energy} / 24
                </div>
                <div className="text-sm text-muted-foreground">Energy</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Picture Dialog */}
        <Dialog
          open={showProfilePictureDialog}
          onOpenChange={setShowProfilePictureDialog}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Profile Picture</DialogTitle>
              <DialogDescription>
                Upload or delete your profile picture
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {profilePicturePreview && (
                <div className="flex justify-center">
                  <div className="relative inline-block">
                    <img
                      src={profilePicturePreview}
                      alt="Profile Preview"
                      className="w-32 h-32 rounded-full object-cover border-2"
                    />
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() =>
                    document.getElementById("profile-picture-upload").click()
                  }
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {profilePicturePreview ? "Change Picture" : "Upload Picture"}
                </Button>
                <input
                  id="profile-picture-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                {profilePicturePreview && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDeleteProfilePicture}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Profile Picture Confirmation Dialog */}
        <Dialog
          open={showDeleteProfilePictureDialog}
          onOpenChange={setShowDeleteProfilePictureDialog}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Profile Picture?</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete your profile picture? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteProfilePictureDialog(false)}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteProfilePicture}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Finance Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Finance</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowMoney(!showMoney);
                  updateUser({
                    settings: {
                      ...currentUser.settings,
                      showRealMoney: !showMoney,
                    },
                  });
                }}
              >
                {showMoney ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {showMoney
                ? `${currentUser.settings.currency} ${realMoney.toFixed(2)}`
                : "•••••"}
            </div>
          </CardContent>
        </Card>

        {/* Mood & Sleep Card */}
        <Card>
          <CardHeader>
            <CardTitle>Wellness</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Current Mood */}
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Smile className="h-4 w-4" />
                  <span>Current Mood</span>
                </div>
                <div className="text-2xl font-bold">
                  {currentMood ? (
                    <div className="flex items-center gap-2">
                      <span>{getRatingEmoji(currentMood.rating)}</span>
                      <span>{getMoodLabel(currentMood.rating)}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Not recorded</span>
                  )}
                </div>
              </div>

              {/* Yesterday's Sleep */}
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Moon className="h-4 w-4" />
                  <span>Yesterday's Sleep</span>
                </div>
                <div className="text-2xl font-bold">
                  {yesterdaySleep ? (
                    <span>
                      {yesterdaySleep.value}{" "}
                      {yesterdaySleep.value === 1 ? "hour" : "hours"}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Not recorded</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pomodoro */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pomodoro</CardTitle>
              <CardDescription>
                {isRest ? "Rest Time" : "Focus Time"}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowMonthlyStatsDialog(true)}
              title="View Monthly Focus Stats"
            >
              <Calendar className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Pomodoro Timer */}
            <div className="text-center space-y-4">
              <div className="text-5xl font-bold">
                {formatTime(pomodoroTime)}
              </div>
              <div className="flex justify-center space-x-2">
                <Button
                  onClick={() => {
                    if (!isRunning) {
                      // When starting, set initial time
                      if (pomodoroTime === 25 * 60 || pomodoroTime === 5 * 60) {
                        setInitialPomodoroTime(pomodoroTime);
                      }
                    }
                    setIsRunning(!isRunning);
                  }}
                  variant={isRunning ? "destructive" : "default"}
                >
                  {isRunning ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={stopPomodoro}
                  disabled={pomodoroTime === initialPomodoroTime && !isRunning}
                >
                  <Square className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Daily Progress Stats */}
            <div className="grid grid-cols-3 gap-4 items-center">
              {/* Yesterday */}
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">
                  Yesterday
                </div>
                <div className="text-3xl font-bold">
                  {pomodoroProgress.yesterdayMinutes}
                </div>
                <div className="text-sm text-muted-foreground">minutes</div>
              </div>

              {/* Daily Goal with Donut Chart */}
              <div className="text-center">
                <div className="relative inline-block">
                  <svg
                    width="120"
                    height="120"
                    className="transform -rotate-90"
                  >
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-muted opacity-20"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 50}`}
                      strokeDashoffset={`${
                        2 * Math.PI * 50 * (1 - pomodoroProgress.progress / 100)
                      }`}
                      className="text-primary transition-all duration-300"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {isEditingDailyGoal ? (
                      <div className="space-y-1">
                        <Input
                          type="number"
                          min="0"
                          max="480"
                          value={tempDailyGoal}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setTempDailyGoal(Math.min(480, Math.max(0, val)));
                          }}
                          onBlur={handleDailyGoalSave}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleDailyGoalSave();
                            } else if (e.key === "Escape") {
                              handleDailyGoalCancel();
                            }
                          }}
                          className="w-20 text-center text-lg font-bold h-auto py-1 px-2"
                          placeholder="60"
                          autoFocus
                        />
                        <div className="text-xs text-muted-foreground">
                          minutes (max: 480)
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                          <span>Daily goal</span>
                          {!isEditingDailyGoal && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={handleDailyGoalEdit}
                              className="h-4 w-4"
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <div className="text-2xl font-bold">
                          {pomodoroProgress.dailyGoal >= 60
                            ? Math.floor(pomodoroProgress.dailyGoal / 60)
                            : pomodoroProgress.dailyGoal}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {pomodoroProgress.dailyGoal >= 60
                            ? pomodoroProgress.dailyGoal % 60 === 0
                              ? "hour"
                              : `hour${
                                  Math.floor(pomodoroProgress.dailyGoal / 60) >
                                  1
                                    ? "s"
                                    : ""
                                }`
                            : "minutes"}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Completed: {pomodoroProgress.completed} minutes
                </div>
              </div>

              {/* Streak */}
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Streak</div>
                <div className="text-3xl font-bold">
                  {pomodoroProgress.streak}
                </div>
                <div className="text-sm text-muted-foreground">days</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Focus Stats Dialog */}
      <Dialog open={showMonthlyStatsDialog} onOpenChange={setShowMonthlyStatsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Monthly Focus Stats</DialogTitle>
            <DialogDescription>
              View your pomodoro activity throughout the month
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (selectedMonth === 0) {
                      setSelectedMonth(11);
                      setSelectedYear(selectedYear - 1);
                    } else {
                      setSelectedMonth(selectedMonth - 1);
                    }
                  }}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-[120px] text-center">
                  {new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const now = new Date();
                    const currentMonth = now.getMonth();
                    const currentYear = now.getFullYear();
                    if (selectedMonth === 11) {
                      setSelectedMonth(0);
                      setSelectedYear(selectedYear + 1);
                    } else if (selectedMonth < currentMonth || selectedYear < currentYear) {
                      setSelectedMonth(selectedMonth + 1);
                    }
                  }}
                  disabled={
                    selectedMonth === new Date().getMonth() &&
                    selectedYear === new Date().getFullYear()
                  }
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Heatmap Grid */}
            <div className="relative flex-1 overflow-hidden flex gap-2">
              <div 
                ref={heatmapScrollRef}
                className="overflow-x-auto overflow-y-auto border rounded-lg p-4 bg-muted/30"
                style={{ 
                  height: '312px' // 10 rows * 28px (24px cell + 4px gap) + 32px padding
                }}
              >
                {monthlyPomodoroData && (
                  <MonthlyHeatmap
                    data={monthlyPomodoroData}
                    selectedMonth={selectedMonth}
                    selectedYear={selectedYear}
                    hoveredCell={hoveredCell}
                    setHoveredCell={setHoveredCell}
                    setTooltipPosition={setTooltipPosition}
                  />
                )}
              </div>
              {/* Scroll Buttons */}
              <div className="flex flex-col gap-2 justify-center">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (heatmapScrollRef.current) {
                      heatmapScrollRef.current.scrollBy({
                        top: -100,
                        behavior: 'smooth'
                      });
                    }
                  }}
                  className="h-10 w-10"
                  title="Scroll up"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (heatmapScrollRef.current) {
                      heatmapScrollRef.current.scrollBy({
                        top: 100,
                        behavior: 'smooth'
                      });
                    }
                  }}
                  className="h-10 w-10"
                  title="Scroll down"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
              {/* Tooltip */}
              {hoveredCell && monthlyPomodoroData && (() => {
                const [date, hour] = hoveredCell.split('-').map(Number);
                const key = `${date}-${hour}`;
                const cellData = monthlyPomodoroData.data[key];
                
                if (!cellData) return null;
                
                return (
                  <div 
                    className="fixed bg-popover border border-border rounded-md p-2 shadow-lg z-50 pointer-events-none"
                    style={{
                      left: `${tooltipPosition.x + 10}px`,
                      top: `${tooltipPosition.y - 10}px`,
                    }}
                  >
                    <div className="text-xs font-medium whitespace-nowrap">
                      {date} {new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', { month: 'short' })}, {hour}:00
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {cellData.count} pomodoro{cellData.count > 1 ? 's' : ''} • {cellData.totalMinutes} minutes
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Building Allocation Dialog */}
      <Dialog
        open={showBuildingAllocationDialog}
        onOpenChange={setShowBuildingAllocationDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Allocate Pomodoro Minutes
            </DialogTitle>
            <DialogDescription>
              Select a building to allocate {buildPowerToAllocate} build power from your completed pomodoro session.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Building</Label>
              <Select
                value={selectedBuildingId || ""}
                onValueChange={setSelectedBuildingId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a building" />
                </SelectTrigger>
                <SelectContent>
                  {buildingsInProgress.map((building) => {
                    const progressPercent = building.buildPowerRequired > 0
                      ? Math.round(
                          (building.buildProgress / building.buildPowerRequired) * 100
                        )
                      : 100;
                    return (
                      <SelectItem key={building._id} value={building._id}>
                        {building.name || building.type} ({progressPercent}% complete)
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            {selectedBuildingId && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-2">
                  Progress after allocation:
                </div>
                {(() => {
                  const building = buildingsInProgress.find(
                    (b) => b._id === selectedBuildingId
                  );
                  if (!building) return null;
                  const newProgress =
                    building.buildProgress + buildPowerToAllocate;
                  const newPercent = building.buildPowerRequired > 0
                    ? Math.min(
                        Math.round((newProgress / building.buildPowerRequired) * 100),
                        100
                      )
                    : 100;
                  return (
                    <div className="space-y-2">
                      <div className="text-lg font-semibold">
                        {newPercent}%
                      </div>
                      <div className="w-full bg-background rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${newPercent}%` }}
                        />
                      </div>
                      {newProgress >= building.buildPowerRequired && (
                        <div className="text-sm text-green-500 font-semibold">
                          Building will be completed!
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowBuildingAllocationDialog(false);
                setSelectedBuildingId(null);
              }}
            >
              Skip
            </Button>
            <Button
              onClick={async () => {
                if (!selectedBuildingId) {
                  toast.error("Please select a building");
                  return;
                }
                try {
                  await api.post(`/buildings/${selectedBuildingId}/start-build`, {
                    buildPower: buildPowerToAllocate,
                  });
                  toast.success(
                    `Allocated ${buildPowerToAllocate} build power to building`
                  );
                  await refreshUser();
                  setShowBuildingAllocationDialog(false);
                  setSelectedBuildingId(null);
                  setBuildPowerToAllocate(0);
                } catch (error) {
                  console.error("Error allocating minutes:", error);
                  toast.error(
                    error.response?.data?.error || "Error allocating minutes"
                  );
                }
              }}
              disabled={!selectedBuildingId}
            >
              Allocate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Monthly Heatmap Component
function MonthlyHeatmap({ data, selectedMonth, selectedYear, hoveredCell, setHoveredCell, setTooltipPosition }) {
  // Get number of days in the month
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  
  // Generate array of hours (0-23)
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  // Generate array of dates (1 to daysInMonth)
  const dates = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  
  // Get cell data
  const getCellData = (date, hour) => {
    const key = `${date}-${hour}`;
    return data.data[key] || null;
  };
  
  // Get color intensity based on count
  const getCellColor = (cellData) => {
    if (!cellData) return 'bg-muted/20';
    
    const count = cellData.count;
    if (count === 1) return 'bg-green-400';
    if (count === 2) return 'bg-green-500';
    if (count >= 3 && count < 5) return 'bg-green-600';
    if (count >= 5) return 'bg-primary';
    return 'bg-green-300';
  };
  
  return (
    <div className="inline-block">
      {/* Hour labels (top) */}
      <div className="flex mb-2">
        <div className="w-16 flex-shrink-0"></div> {/* Spacer for date labels */}
        <div className="flex gap-1">
          {hours.map((hour) => (
            <div
              key={hour}
              className="w-6 text-xs text-center text-muted-foreground font-medium"
              title={`${hour}:00`}
            >
              {hour}
            </div>
          ))}
        </div>
      </div>
      
      {/* Grid */}
      <div className="flex flex-col gap-1">
        {dates.map((date) => (
          <div key={date} className="flex items-center gap-1">
            {/* Date label (left) */}
            <div className="w-16 flex-shrink-0 text-xs text-muted-foreground text-right pr-2">
              {date}
            </div>
            
            {/* Cells */}
            <div className="flex gap-1">
              {hours.map((hour) => {
                const cellData = getCellData(date, hour);
                const cellKey = `${date}-${hour}`;
                const isHovered = hoveredCell === cellKey;
                
                return (
                  <div
                    key={hour}
                    className={`w-6 h-6 rounded-sm border border-border/50 transition-all cursor-pointer ${getCellColor(cellData)} ${
                      isHovered ? 'ring-2 ring-primary scale-110 z-10' : ''
                    }`}
                    onMouseEnter={(e) => {
                      setHoveredCell(cellKey);
                      setTooltipPosition({ x: e.clientX, y: e.clientY });
                    }}
                    onMouseMove={(e) => {
                      if (hoveredCell === cellKey) {
                        setTooltipPosition({ x: e.clientX, y: e.clientY });
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredCell(null);
                    }}
                    title={
                      cellData
                        ? `${date} ${new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', { month: 'short' })}, ${hour}:00 - ${cellData.count} pomodoro(s), ${cellData.totalMinutes} minutes`
                        : `${date} ${new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', { month: 'short' })}, ${hour}:00 - No pomodoro`
                    }
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
      
    </div>
  );
}
