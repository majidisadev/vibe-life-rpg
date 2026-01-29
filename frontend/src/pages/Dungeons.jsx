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
  DialogTrigger,
} from "../components/ui/dialog";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { Plus, Sword, Zap, Award, Coins, Trash2, Pencil, ChevronLeft, ChevronRight, Lock, Unlock, RotateCcw, ArrowLeft, X, Save, Check, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import api from "../lib/api";
import { useUser } from "../contexts/UserContext";
import ImageUpload from "../components/ImageUpload";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../components/ui/sheet";
import anime from "animejs";
import DamagePopup from "../components/dungeons/DamagePopup";
import AnimatedHPBar from "../components/dungeons/AnimatedHPBar";
import StageTransitionOverlay from "../components/dungeons/StageTransitionOverlay";

export default function Dungeons() {
  const { user, refreshUser } = useUser();
  const [dungeons, setDungeons] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingDungeon, setEditingDungeon] = useState(null);
  const [selectedDungeon, setSelectedDungeon] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: "",
    minLevel: 0,
    stages: [],
    unlocked: false,
  });
  const [enemies, setEnemies] = useState([]);
  const [weapon, setWeapon] = useState(null);
  const [enemySearchQueries, setEnemySearchQueries] = useState({}); // { stageIndex: query }
  const [enemySearchOpen, setEnemySearchOpen] = useState({}); // { stageIndex: boolean }
  // RPG animations
  const [lastDamage, setLastDamage] = useState(null);
  const [showDamagePopup, setShowDamagePopup] = useState(false);
  const [lastAttackEnemyHP, setLastAttackEnemyHP] = useState(null);
  const [showStageTransition, setShowStageTransition] = useState(false);
  const [stageTransitionNumber, setStageTransitionNumber] = useState(null);
  const [pendingStageIndex, setPendingStageIndex] = useState(null);
  const dungeonCardsRef = useRef(null);
  const enemyContainerRef = useRef(null);
  const attackBtnRef = useRef(null);
  const sheetBattleRef = useRef(null);
  const prevStageIndexRef = useRef(null);

  // Resource emoji mapping
  const resourceEmojis = {
    meat: "🥩",
    wood: "🪵",
    stone: "🪨",
    iron: "⚙️",
    crystal: "💎",
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadWeapon();
  }, [user?.equippedWeapon]);

  useEffect(() => {
    if (selectedDungeon && user) {
      const progress = user.dungeonProgress?.find(
        (p) => p.dungeonId === selectedDungeon._id
      );
      if (progress) {
        // Set to current stage
        if (progress.currentStage < selectedDungeon.stages.length) {
          setCurrentStageIndex(progress.currentStage);
        } else {
          // All stages completed, show last stage
          setCurrentStageIndex(selectedDungeon.stages.length - 1);
        }
      } else {
        setCurrentStageIndex(0);
      }
    }
  }, [selectedDungeon, user]);

  // Stagger dungeon cards on load
  useEffect(() => {
    if (!dungeons.length || !dungeonCardsRef.current) return;
    const cards = dungeonCardsRef.current.querySelectorAll(".dungeon-card");
    if (!cards.length) return;
    anime.set(cards, { opacity: 0, translateY: 24 });
    anime({
      targets: cards,
      opacity: [0, 1],
      translateY: [24, 0],
      duration: 500,
      delay: anime.stagger(60, { start: 100 }),
      easing: "easeOutExpo",
    });
  }, [dungeons.length]);

  // Enemy intro (fade + scale) when stage changes in sheet
  useEffect(() => {
    if (!sheetOpen || !selectedDungeon || enemyContainerRef.current == null) return;
    const prev = prevStageIndexRef.current;
    prevStageIndexRef.current = currentStageIndex;
    if (prev === currentStageIndex) return;
    const el = enemyContainerRef.current;
    anime.set(el, { opacity: 0, scale: 0.9 });
    anime({
      targets: el,
      opacity: [0, 1],
      scale: [0.9, 1],
      duration: 400,
      easing: "easeOutExpo",
    });
  }, [sheetOpen, selectedDungeon, currentStageIndex]);

  // Battle area fade-in when sheet opens
  useEffect(() => {
    if (!sheetOpen || !sheetBattleRef.current) return;
    const el = sheetBattleRef.current;
    anime.set(el, { opacity: 0 });
    anime({ targets: el, opacity: [0, 1], duration: 350, easing: "easeOutExpo" });
  }, [sheetOpen]);

  // Reset stage ref when sheet closes so enemy intro runs on next open
  useEffect(() => {
    if (!sheetOpen) prevStageIndexRef.current = null;
  }, [sheetOpen]);

  const loadData = async () => {
    try {
      const [dungeonsRes, enemiesRes] = await Promise.all([
        api.get("/dungeons"),
        api.get("/characters?characterType=enemy&limit=1000"), // Load all enemies
      ]);
      setDungeons(Array.isArray(dungeonsRes.data) ? dungeonsRes.data : []);
      
      // Handle both old format (array) and new format (object with data and pagination)
      let enemiesData = [];
      if (Array.isArray(enemiesRes.data)) {
        enemiesData = enemiesRes.data;
      } else if (enemiesRes.data?.data && Array.isArray(enemiesRes.data.data)) {
        enemiesData = enemiesRes.data.data;
      }
      setEnemies(enemiesData);
    } catch (error) {
      console.error("Error loading data:", error);
      setDungeons([]);
      setEnemies([]);
    }
  };

  const loadWeapon = async () => {
    try {
      if (user?.equippedWeapon) {
        const res = await api.get(`/weapons/${user.equippedWeapon}`);
        setWeapon(res.data);
      } else {
        setWeapon(null);
      }
    } catch (error) {
      console.error("Error loading weapon:", error);
      setWeapon(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Prepare data: ensure stages have proper format
      const submitData = {
        ...formData,
        stages: formData.stages.map((stage) => ({
          stageNumber: stage.stageNumber,
          enemy: stage.enemy || null,
          unlocked: stage.unlocked || false,
        })),
      };

      if (editingDungeon) {
        await api.put(`/dungeons/${editingDungeon._id}`, submitData);
      } else {
        await api.post("/dungeons", submitData);
      }
      setOpen(false);
      setEditingDungeon(null);
      resetForm();
      loadData();
      toast.success("Dungeon saved");
    } catch (error) {
      console.error("Error saving dungeon:", error);
      toast.error("Error saving dungeon");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      image: "",
      minLevel: 0,
      stages: [],
      unlocked: false,
    });
    setEnemySearchQueries({});
    setEnemySearchOpen({});
  };

  const openEditDialog = (dungeon) => {
    setEditingDungeon(dungeon);
    // Process stages to ensure enemy is ObjectId string
    const processedStages = (dungeon.stages || []).map((stage) => ({
      stageNumber: stage.stageNumber || 0,
      enemy: stage.enemy?._id || stage.enemy || "",
      unlocked: stage.unlocked || false,
    }));
    setFormData({
      name: dungeon.name || "",
      description: dungeon.description || "",
      image: dungeon.image || "",
      minLevel: dungeon.minLevel || 0,
      stages: processedStages,
      unlocked: dungeon.unlocked || false,
    });
    // Reset enemy search states
    setEnemySearchQueries({});
    setEnemySearchOpen({});
    setOpen(true);
  };

  const addStage = () => {
    const newStageNumber = formData.stages.length + 1;
    setFormData({
      ...formData,
      stages: [
        ...formData.stages,
        { stageNumber: newStageNumber, enemy: "", unlocked: false },
      ],
    });
  };

  const removeStage = (index) => {
    const newStages = formData.stages.filter((_, i) => i !== index);
    // Re-number stages
    const renumberedStages = newStages.map((stage, i) => ({
      ...stage,
      stageNumber: i + 1,
    }));
    setFormData({ ...formData, stages: renumberedStages });
  };

  const updateStage = (index, field, value) => {
    const newStages = [...formData.stages];
    newStages[index] = { ...newStages[index], [field]: value };
    setFormData({ ...formData, stages: newStages });
  };

  const handleUnlock = async (dungeonId) => {
    try {
      const res = await api.post(`/dungeons/${dungeonId}/unlock`);
      if (res.data.success) {
        toast.success("Dungeon unlocked!");
        await refreshUser();
        loadData();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to unlock dungeon");
    }
  };

  const handleExplore = (dungeon) => {
    setSelectedDungeon(dungeon);
    setSheetOpen(true);
  };

  const handleRestart = async (dungeonId) => {
    try {
      const res = await api.post(`/dungeons/${dungeonId}/restart`);
      if (res.data.success) {
        toast.success("Dungeon restarted!");
        await refreshUser();
        loadData();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to restart dungeon");
    }
  };

  const handleDelete = async () => {
    if (!editingDungeon) return;
    try {
      await api.delete(`/dungeons/${editingDungeon._id}`);
      toast.success("Dungeon deleted");
      setShowDeleteDialog(false);
      setOpen(false);
      setEditingDungeon(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error("Error deleting dungeon:", error);
      toast.error(error.response?.data?.error || "Error deleting dungeon");
    }
  };

  const handleAttack = async () => {
    if (!selectedDungeon) return;
    
    try {
      if (!user || user.energy < 1) {
        toast.error("Not enough energy");
        return;
      }

      // Check if user is viewing the active stage
      const progress = user.dungeonProgress?.find(
        (p) => p.dungeonId === selectedDungeon._id
      );
      const activeStageIndex = progress?.currentStage || 0;
      
      if (currentStageIndex !== activeStageIndex) {
        toast.error("You can only attack the current active stage");
        return;
      }

      const res = await api.post(`/dungeons/${selectedDungeon._id}/attack`);
      if (res.data.success) {
        const { damageDealt, enemyHP, enemyDefeated, reward } = res.data;
        const currentEnemy = getCurrentEnemy(selectedDungeon, true);
        const maxHP = currentEnemy?.enemyStats?.hp || 1;

        setLastDamage(damageDealt);
        setShowDamagePopup(true);
        setLastAttackEnemyHP(Math.max(0, enemyHP));

        if (enemyContainerRef.current) {
          anime({
            targets: enemyContainerRef.current,
            translateX: [-6, 6, -6, 6, 0],
            duration: 400,
            easing: "easeOutExpo",
          });
        }
        if (attackBtnRef.current) {
          anime({
            targets: attackBtnRef.current,
            scale: [1.08, 1],
            duration: 200,
            easing: "easeOutExpo",
          });
        }

        toast.success(`Dealt ${damageDealt} damage!`, {
          description: enemyDefeated 
            ? `Enemy defeated! +${reward?.xp || 0} XP, +${reward?.coins || 0} Coins`
            : `Enemy HP: ${enemyHP}/${maxHP}`,
        });

        if (enemyDefeated && reward?.resources) {
          const resources = reward.resources;
          const resourceList = [];
          Object.keys(resourceEmojis).forEach((resourceKey) => {
            const amount = resources[resourceKey] || 0;
            if (amount > 0) {
              resourceList.push(`${resourceEmojis[resourceKey]} +${amount}`);
            }
          });
          if (resourceList.length > 0) {
            toast.success("Resources gained!", {
              description: resourceList.join(" "),
            });
          }
        }

        await refreshUser();
        loadData();
        if (res.data.dungeon) setSelectedDungeon(res.data.dungeon);
      }
    } catch (error) {
      console.error("Error attacking:", error);
      toast.error(error.response?.data?.error || "Error attacking");
    }
  };

  const getCurrentEnemy = (dungeon = selectedDungeon, useStageIndex = false) => {
    if (!dungeon) return null;
    
    let enemy = null;
    
    // If useStageIndex is true (for side panel), use currentStageIndex state
    if (useStageIndex && selectedDungeon && selectedDungeon._id === dungeon._id) {
      if (currentStageIndex < dungeon.stages.length) {
        enemy = dungeon.stages[currentStageIndex]?.enemy;
      }
    } else {
      // Otherwise, use progress from user (for card list)
      if (!user) return null;
      const progress = user.dungeonProgress?.find(
        (p) => p.dungeonId === dungeon._id
      );
      if (!progress) {
        enemy = dungeon.stages[0]?.enemy;
      } else if (progress.currentStage < dungeon.stages.length) {
        enemy = dungeon.stages[progress.currentStage]?.enemy;
      }
    }
    
    // Return null if enemy is not a populated object (i.e., it's just an ObjectId)
    if (enemy && (typeof enemy !== 'object' || !enemy.name)) {
      return null;
    }
    
    return enemy;
  };

  const getCurrentEnemyHP = () => {
    if (!selectedDungeon || !user) return null;
    const progress = user.dungeonProgress?.find(
      (p) => p.dungeonId === selectedDungeon._id
    );
    
    // Check if we're viewing the current active stage (from progress)
    const activeStageIndex = progress?.currentStage || 0;
    const isViewingActiveStage = currentStageIndex === activeStageIndex || 
      (currentStageIndex === selectedDungeon.stages.length && activeStageIndex >= selectedDungeon.stages.length);
    
    // Only show HP tracking if viewing the active stage
    if (progress && isViewingActiveStage) {
      if (progress.currentEnemyHP !== null && progress.currentEnemyHP !== undefined) {
        return Math.max(0, progress.currentEnemyHP);
      }
    }
    
    // Otherwise, show full HP for the enemy at this stage
    const enemy = getCurrentEnemy(selectedDungeon, true);
    return enemy?.enemyStats?.hp || null;
  };

  const getMaxEnemyHP = () => {
    const enemy = getCurrentEnemy(selectedDungeon, true);
    return enemy?.enemyStats?.hp || 1;
  };

  const canNavigateToStage = (stageIndex) => {
    if (!selectedDungeon) return false;
    if (stageIndex === 0) return true;
    
    const progress = user?.dungeonProgress?.find(
      (p) => p.dungeonId === selectedDungeon._id
    );
    
    if (!progress) return false;
    
    // Can navigate to stage if it's unlocked or if previous stage is completed
    if (stageIndex <= progress.currentStage) return true;
    
    return selectedDungeon.stages[stageIndex]?.unlocked || false;
  };

  const navigateToStage = (stageIndex) => {
    if (!canNavigateToStage(stageIndex)) {
      toast.error("Stage not unlocked yet");
      return;
    }
    setPendingStageIndex(stageIndex);
    setStageTransitionNumber(stageIndex + 1);
    setShowStageTransition(true);
  };

  const onStageTransitionComplete = () => {
    if (pendingStageIndex != null) {
      setCurrentStageIndex(pendingStageIndex);
      setPendingStageIndex(null);
    }
    setShowStageTransition(false);
    setStageTransitionNumber(null);
  };

  const onDamagePopupComplete = () => {
    setLastDamage(null);
    setShowDamagePopup(false);
    setLastAttackEnemyHP(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/fantasy-world">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Dungeons</h1>
        </div>
        <Dialog
          open={open}
          onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) {
              resetForm();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingDungeon(null);
                resetForm();
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Dungeon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingDungeon ? "Edit Dungeon" : "New Dungeon"}
              </DialogTitle>
              <DialogDescription>
                {editingDungeon
                  ? "Edit dungeon details and stages"
                  : "Create a new dungeon with stages"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <ImageUpload
                value={formData.image}
                onChange={(value) => setFormData({ ...formData, image: value })}
              />
              
              <div>
                <Label htmlFor="minLevel">Minimum Level to Unlock</Label>
                <Input
                  id="minLevel"
                  type="number"
                  min="0"
                  value={formData.minLevel}
                  onChange={(e) =>
                    setFormData({ ...formData, minLevel: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              
              {/* Stages Management */}
              <div>
                <Label>Stages</Label>
                <div className="space-y-2 mt-2">
                  {formData.stages.map((stage, index) => (
                    <div
                      key={index}
                      className="flex gap-2 items-end p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <Label className="text-sm">
                          Stage {stage.stageNumber} - Enemy
                        </Label>
                        <Popover
                          open={enemySearchOpen[index] || false}
                          onOpenChange={(isOpen) => {
                            setEnemySearchOpen((prev) => ({
                              ...prev,
                              [index]: isOpen,
                            }));
                            if (isOpen) {
                              setEnemySearchQueries((prev) => ({
                                ...prev,
                                [index]: "",
                              }));
                            }
                          }}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between"
                            >
                              {stage.enemy?._id || stage.enemy
                                ? enemies.find(
                                    (e) =>
                                      e._id ===
                                      (stage.enemy?._id || stage.enemy)
                                  )?.name || "Select enemy..."
                                : "Select enemy..."}
                              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-[var(--radix-popover-trigger-width)] p-0"
                            align="start"
                          >
                            <div className="p-2">
                              <Input
                                placeholder="Search enemy..."
                                value={enemySearchQueries[index] || ""}
                                onChange={(e) =>
                                  setEnemySearchQueries((prev) => ({
                                    ...prev,
                                    [index]: e.target.value,
                                  }))
                                }
                                className="mb-2"
                                autoFocus
                              />
                            </div>
                            {!enemySearchQueries[index]?.trim() ? (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
                                Type to search enemy...
                              </div>
                            ) : (
                              <div className="max-h-[300px] overflow-y-auto">
                                <div
                                  className="px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-sm"
                                  onClick={() => {
                                    updateStage(index, "enemy", "");
                                    setEnemySearchOpen((prev) => ({
                                      ...prev,
                                      [index]: false,
                                    }));
                                    setEnemySearchQueries((prev) => ({
                                      ...prev,
                                      [index]: "",
                                    }));
                                  }}
                                >
                                  <div className="flex items-center gap-2">
                                    <Check
                                      className={`h-4 w-4 ${
                                        !stage.enemy?._id && !stage.enemy
                                          ? "opacity-100"
                                          : "opacity-0"
                                      }`}
                                    />
                                    None
                                  </div>
                                </div>
                                {enemies
                                  .filter((enemy) =>
                                    enemy.name
                                      .toLowerCase()
                                      .includes(
                                        (enemySearchQueries[index] || "").toLowerCase()
                                      )
                                  )
                                  .length === 0 ? (
                                  <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
                                    No results found
                                  </div>
                                ) : (
                                  enemies
                                    .filter((enemy) =>
                                      enemy.name
                                        .toLowerCase()
                                        .includes(
                                          (enemySearchQueries[index] || "").toLowerCase()
                                        )
                                    )
                                    .map((enemy) => (
                                      <div
                                        key={enemy._id}
                                        className="px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-sm"
                                        onClick={() => {
                                          updateStage(index, "enemy", enemy._id);
                                          setEnemySearchOpen((prev) => ({
                                            ...prev,
                                            [index]: false,
                                          }));
                                          setEnemySearchQueries((prev) => ({
                                            ...prev,
                                            [index]: "",
                                          }));
                                        }}
                                      >
                                        <div className="flex items-center gap-2">
                                          <Check
                                            className={`h-4 w-4 ${
                                              (stage.enemy?._id || stage.enemy) ===
                                              enemy._id
                                                ? "opacity-100"
                                                : "opacity-0"
                                            }`}
                                          />
                                          <span>
                                            {enemy.name}
                                            {enemy.enemyStats && (
                                              <span className="text-xs text-muted-foreground ml-2">
                                                (HP: {enemy.enemyStats.hp})
                                              </span>
                                            )}
                                          </span>
                                        </div>
                                      </div>
                                    ))
                                )}
                              </div>
                            )}
                          </PopoverContent>
                        </Popover>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => removeStage(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addStage}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Stage
                  </Button>
                </div>
              </div>

              <DialogFooter>
                {editingDungeon && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                <Button type="submit">
                  <Save className="h-4 w-4" />
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div ref={dungeonCardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dungeons.map((dungeon) => {
          const progress = user?.dungeonProgress?.find(
            (p) => p.dungeonId === dungeon._id
          );
          const completed = progress?.completed || false;
          const canUnlock = user && user.level >= dungeon.minLevel;
          const isUnlocked = dungeon.unlocked;

          return (
            <Card key={dungeon._id} className="dungeon-card">
              {dungeon.image && (
                <div className="w-full h-48 overflow-hidden">
                  <img
                    src={dungeon.image}
                    alt={dungeon.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle>{dungeon.name}</CardTitle>
                    <CardDescription>{dungeon.description}</CardDescription>
                    <div className="text-xs text-muted-foreground mt-1">
                      Level {dungeon.minLevel || 0} required
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(dungeon)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {completed ? (
                  <div className="text-center py-4 space-y-3">
                    <Award className="h-12 w-12 mx-auto mb-2 text-yellow-500" />
                    <div className="font-semibold">Completed!</div>
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => handleRestart(dungeon._id)}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restart
                    </Button>
                  </div>
                ) : isUnlocked ? (
                  <Button
                    className="w-full"
                    onClick={() => handleExplore(dungeon)}
                  >
                    <Sword className="h-4 w-4 mr-2" />
                    Explore
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => handleUnlock(dungeon._id)}
                    disabled={!canUnlock}
                  >
                    {canUnlock ? (
                      <>
                        <Unlock className="h-4 w-4 mr-2" />
                        Unlock
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Level {dungeon.minLevel || 0} Required
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Side Panel for Exploring Dungeon */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selectedDungeon?.name}</SheetTitle>
            <SheetDescription>{selectedDungeon?.description}</SheetDescription>
          </SheetHeader>

          {selectedDungeon && (
            <div className="mt-6 space-y-6">
              {/* Stage Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateToStage(Math.max(0, currentStageIndex - 1))}
                  disabled={currentStageIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-center">
                  <div>
                    <div className="font-semibold">Stage {currentStageIndex + 1}</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedDungeon.stages.length} stages total
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateToStage(currentStageIndex + 1)}
                  disabled={
                    currentStageIndex >= selectedDungeon.stages.length - 1 ||
                    !canNavigateToStage(currentStageIndex + 1)
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Battle Arena */}
              {(() => {
                const enemy = getCurrentEnemy(selectedDungeon, true);
                const currentHP = getCurrentEnemyHP();
                const maxHP = getMaxEnemyHP();
                const displayHP = showDamagePopup && lastAttackEnemyHP != null
                  ? lastAttackEnemyHP
                  : (currentHP ?? 0);

                if (!enemy) {
                  return (
                    <div className="text-center py-8 text-muted-foreground">
                      No enemy available
                    </div>
                  );
                }

                return (
                  <div
                    ref={sheetBattleRef}
                    className="relative rounded-xl border bg-muted/20 dark:bg-muted/10 p-4 space-y-4 min-h-[200px]"
                  >
                    <StageTransitionOverlay
                      stageNumber={stageTransitionNumber}
                      visible={showStageTransition}
                      onComplete={onStageTransitionComplete}
                    />
                    <div ref={enemyContainerRef} className="relative">
                      <div className="text-sm text-muted-foreground mb-1">Enemy</div>
                      <div className="flex items-center gap-3">
                        <div className="text-2xl font-bold">{enemy.name}</div>
                        {enemy.cover && (
                          <img
                            src={enemy.cover}
                            alt={enemy.name}
                            className="w-14 h-14 rounded-lg object-cover border-2 border-border shadow-md"
                          />
                        )}
                      </div>
                      <DamagePopup
                        value={lastDamage}
                        visible={showDamagePopup}
                        onComplete={onDamagePopupComplete}
                      />
                    </div>

                    <AnimatedHPBar
                      current={displayHP}
                      max={maxHP}
                    />

                    {weapon && (
                      <div className="p-3 rounded-lg bg-muted/50 border">
                        <div className="text-sm text-muted-foreground">Equipped Weapon</div>
                        <div className="font-semibold">{weapon.name}</div>
                        <div className="text-sm">Damage: +{weapon.damageBonus}</div>
                      </div>
                    )}

                    <Button
                      ref={attackBtnRef}
                      className="w-full"
                      onClick={handleAttack}
                      disabled={!user || user.energy < 1}
                      size="lg"
                    >
                      <Sword className="h-4 w-4 mr-2" />
                      Attack (-1 Energy)
                    </Button>
                    {(!user || user.energy < 1) && (
                      <div className="text-xs text-muted-foreground text-center">
                        <Zap className="h-3 w-3 inline mr-1" />
                        Not enough energy
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Stages List */}
              <div className="space-y-2">
                <div className="text-sm font-semibold">Stages</div>
                {(() => {
                  const progress = user?.dungeonProgress?.find(
                    (p) => p.dungeonId === selectedDungeon._id
                  );
                  return selectedDungeon.stages.map((stage, index) => {
                    const isUnlocked = stage.unlocked || index === 0;
                    const isCurrent = index === currentStageIndex;
                    const isCompleted = progress && index < progress.currentStage;

                    return (
                      <div
                        key={index}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          isCurrent ? "bg-primary text-primary-foreground" : ""
                        } ${!isUnlocked ? "opacity-50" : ""}`}
                        onClick={() => navigateToStage(index)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-semibold">Stage {index + 1}</div>
                              {stage.enemy && typeof stage.enemy === 'object' && stage.enemy.name && (
                                <div className="text-sm opacity-80">
                                  {stage.enemy.name}
                                </div>
                              )}
                              {stage.enemy && (typeof stage.enemy !== 'object' || !stage.enemy.name) && (
                                <div className="text-sm opacity-80 text-muted-foreground">
                                  Enemy not loaded
                                </div>
                              )}
                            </div>
                            {stage.enemy && typeof stage.enemy === 'object' && stage.enemy.cover && (
                              <img
                                src={stage.enemy.cover}
                                alt={stage.enemy.name || 'Enemy'}
                                className="w-10 h-10 rounded-lg object-cover border"
                              />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {isCompleted && <Award className="h-4 w-4" />}
                            {isCurrent && <div className="text-xs">Current</div>}
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}
          </SheetContent>
      </Sheet>

      {/* Delete Dungeon Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Dungeon?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{editingDungeon?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

