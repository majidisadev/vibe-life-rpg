import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { AlertTriangle, X, RotateCcw, Save } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import api from '../lib/api';
import { useUser } from '../contexts/UserContext';

export default function Settings() {
  const { refreshUser } = useUser();
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({
    tags: [],
    difficulty: {
      easy: { reward: { xp: 1, coins: 1 }, punishment: { coins: -1 } },
      medium: { reward: { xp: 5, coins: 5 }, punishment: { coins: -5 } },
      hard: { reward: { xp: 10, coins: 10 }, punishment: { coins: -10 } }
    },
    financeCategories: [],
    budgetPerYear: 0,
    currency: 'USD',
    showRealMoney: false,
    pomodoroXP: 10,
    theme: 'spring',
    darkMode: 'light',
  });
  const [originalSettings, setOriginalSettings] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showResetStatsDialog, setShowResetStatsDialog] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newCategoryType, setNewCategoryType] = useState('income');

  useEffect(() => {
    loadData();
  }, []);

  // Compare settings with original to detect changes
  useEffect(() => {
    if (!originalSettings) return;
    
    const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    setHasUnsavedChanges(hasChanges);
    
    // Show warning banner if there are changes
    setShowWarning(hasChanges);
  }, [settings, originalSettings]);

  // Warn before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  const loadData = async () => {
    try {
      const res = await api.get('/user');
      setUser(res.data);
      const loadedSettings = res.data.settings;
      setSettings({
        ...loadedSettings,
        theme: loadedSettings.theme || 'spring',
        darkMode: loadedSettings.darkMode || 'light',
      });
      // Store original settings for comparison
      setOriginalSettings(JSON.parse(JSON.stringify(loadedSettings)));
      setHasUnsavedChanges(false);
      setShowWarning(false);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSave = async () => {
    try {
      await api.put('/settings', settings);
      await api.put('/user', { settings });
      toast.success('Settings saved!', {
        description: 'Your settings have been successfully saved.',
      });
      await refreshUser(false);
      loadData();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error saving settings', {
        description: 'There was an error saving your settings. Please try again.',
      });
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowCancelDialog(true);
    }
  };

  const confirmCancel = () => {
    // Reset to original settings
    if (originalSettings) {
      setSettings(JSON.parse(JSON.stringify(originalSettings)));
    }
    setHasUnsavedChanges(false);
    setShowWarning(false);
    setShowCancelDialog(false);
  };

  const addTag = () => {
    if (newTag && !settings.tags.includes(newTag)) {
      setSettings({ ...settings, tags: [...settings.tags, newTag] });
      setNewTag('');
    }
  };

  const removeTag = (tag) => {
    setSettings({ ...settings, tags: settings.tags.filter(t => t !== tag) });
  };

  const addCategory = () => {
    if (newCategory && newCategoryType) {
      // Normalize categories to new format if needed
      const normalizedCategories = settings.financeCategories.map(c => 
        typeof c === 'string' ? { name: c, type: 'income' } : c
      );
      
      // Check if category with same name and type already exists
      const exists = normalizedCategories.some(
        c => c.name === newCategory && c.type === newCategoryType
      );
      if (!exists) {
        setSettings({ 
          ...settings, 
          financeCategories: [...normalizedCategories, { name: newCategory, type: newCategoryType }] 
        });
        setNewCategory('');
        setNewCategoryType('income');
      }
    }
  };

  const removeCategory = (categoryName, categoryType) => {
    // Normalize categories to new format if needed
    const normalizedCategories = settings.financeCategories.map(c => 
      typeof c === 'string' ? { name: c, type: 'income' } : c
    );
    
    setSettings({ 
      ...settings, 
      financeCategories: normalizedCategories.filter(
        c => !(c.name === categoryName && c.type === categoryType)
      ) 
    });
  };

  // Helper to get normalized categories
  const getNormalizedCategories = () => {
    if (!settings.financeCategories || settings.financeCategories.length === 0) {
      return [];
    }
    return settings.financeCategories.map(c => 
      typeof c === 'string' ? { name: c, type: 'income' } : c
    );
  };

  const handleResetStats = async () => {
    try {
      await api.post('/user/reset-stats');
      toast.success('Stats reset successfully!', {
        description: 'Level, XP, Coins, and Energy have been reset to 0.',
      });
      setShowResetStatsDialog(false);
      await loadData();
      await refreshUser(false); // Refresh user context without showing toasts
    } catch (error) {
      console.error('Error resetting stats:', error);
      toast.error('Error resetting stats', {
        description: 'There was an error resetting your stats. Please try again.',
      });
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discard Changes?</DialogTitle>
            <DialogDescription>
              Are you sure you want to discard all unsaved changes? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              onClick={confirmCancel}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Stats Warning Dialog */}
      <Dialog open={showResetStatsDialog} onOpenChange={setShowResetStatsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Reset Stats?
            </DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to reset your stats? This will set all of the following to 0:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Level</li>
                <li>XP</li>
                <li>Coins</li>
                <li>Energy</li>
              </ul>
              <p className="mt-3 font-semibold text-destructive">
                This action cannot be undone!
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResetStatsDialog(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              onClick={handleResetStats}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Warning Banner */}
      {showWarning && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                <div>
                  <p className="font-semibold text-yellow-900 dark:text-yellow-100">
                    You have unsaved changes
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-200">
                    Please save or cancel your changes before leaving this page.
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowWarning(false)}
                className="text-yellow-700 hover:text-yellow-900 dark:text-yellow-200"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save and Cancel Buttons */}
      <div className="flex gap-2">
        {hasUnsavedChanges && (
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex-1"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <Button
          onClick={handleSave}
          className={hasUnsavedChanges ? "flex-1" : "w-full"}
          disabled={!hasUnsavedChanges}
        >
          <Save className="h-4 w-4" />
        </Button>
      </div>

      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>Choose a seasonal theme and light or dark appearance.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
            <div className="flex-1 min-w-0">
              <Label htmlFor="theme">Theme</Label>
              <Select
                id="theme"
                value={settings.theme || 'spring'}
                onValueChange={(value) => setSettings({ ...settings, theme: value })}
              >
                <SelectTrigger className="w-full max-w-xs mt-2">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spring">Spring (Green)</SelectItem>
                  <SelectItem value="summer">Summer (Yellow)</SelectItem>
                  <SelectItem value="autumn">Autumn (Orange)</SelectItem>
                  <SelectItem value="winter">Winter (Blue)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="hidden sm:block shrink-0 w-px min-h-[60px] self-stretch bg-border" aria-hidden />
            <div className="flex-1 min-w-0">
              <Label className="text-sm font-medium">Appearance</Label>
              <div className="flex items-center gap-4 mt-2" role="radiogroup" aria-label="Light or dark mode">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="darkMode"
                    value="light"
                    checked={(settings.darkMode || 'light') === 'light'}
                    onChange={() => setSettings({ ...settings, darkMode: 'light' })}
                    className="h-4 w-4 border-primary text-primary focus:ring-primary"
                  />
                  <span className="text-sm">Light</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="darkMode"
                    value="dark"
                    checked={(settings.darkMode || 'light') === 'dark'}
                    onChange={() => setSettings({ ...settings, darkMode: 'dark' })}
                    className="h-4 w-4 border-primary text-primary focus:ring-primary"
                  />
                  <span className="text-sm">Dark</span>
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tags Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Tags Settings</CardTitle>
          <CardDescription>Customize tags for tasks, habits, and missions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="New tag"
              onKeyPress={(e) => e.key === 'Enter' && addTag()}
            />
            <Button onClick={addTag}>Add Tag</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {settings.tags.map((tag) => (
              <div key={tag} className="flex items-center gap-2 px-3 py-1 bg-secondary rounded">
                <span>{tag}</span>
                <button
                  onClick={() => removeTag(tag)}
                  className="text-destructive hover:text-destructive/80"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Difficulty Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Difficulty Settings</CardTitle>
          <CardDescription>Customize rewards and punishments for difficulty levels</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {['easy', 'medium', 'hard'].map((difficulty) => (
            <div key={difficulty} className="space-y-4 border p-4 rounded">
              <h3 className="font-semibold capitalize">{difficulty}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Reward XP</Label>
                  <Input
                    type="number"
                    value={settings.difficulty[difficulty].reward.xp}
                    onChange={(e) => {
                      const newSettings = { ...settings };
                      newSettings.difficulty[difficulty].reward.xp = parseInt(e.target.value);
                      setSettings(newSettings);
                    }}
                  />
                </div>
                <div>
                  <Label>Reward Coins</Label>
                  <Input
                    type="number"
                    value={settings.difficulty[difficulty].reward.coins}
                    onChange={(e) => {
                      const newSettings = { ...settings };
                      newSettings.difficulty[difficulty].reward.coins = parseInt(e.target.value);
                      setSettings(newSettings);
                    }}
                  />
                </div>
                <div>
                  <Label>Punishment Coins</Label>
                  <Input
                    type="number"
                    value={settings.difficulty[difficulty].punishment.coins}
                    onChange={(e) => {
                      const newSettings = { ...settings };
                      newSettings.difficulty[difficulty].punishment.coins = parseInt(e.target.value);
                      setSettings(newSettings);
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Finance Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Finance Settings</CardTitle>
          <CardDescription>Configure finance tracking</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="budgetPerYear">Budget Per Year</Label>
            <Input
              id="budgetPerYear"
              type="number"
              value={settings.budgetPerYear}
              onChange={(e) => setSettings({ ...settings, budgetPerYear: parseFloat(e.target.value) })}
            />
          </div>
          <div>
            <Label htmlFor="currency">Currency</Label>
            <Input
              id="currency"
              value={settings.currency}
              onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
            />
          </div>
          <div>
            <Label>Finance Categories</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="New category"
                onKeyPress={(e) => e.key === 'Enter' && addCategory()}
              />
              <Select
                value={newCategoryType}
                onValueChange={setNewCategoryType}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="outcome">Outcome</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={addCategory}>Add Category</Button>
            </div>
            <div className="space-y-2">
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Income Categories</Label>
                <div className="flex flex-wrap gap-2">
                  {getNormalizedCategories()
                    .filter(c => c.type === 'income')
                    .map((category) => (
                      <div key={`${category.name}-${category.type}`} className="flex items-center gap-2 px-3 py-1 bg-secondary rounded">
                        <span>{category.name}</span>
                        <button
                          onClick={() => removeCategory(category.name, category.type)}
                          className="text-destructive hover:text-destructive/80"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  {getNormalizedCategories().filter(c => c.type === 'income').length === 0 && (
                    <span className="text-sm text-muted-foreground">No income categories</span>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Outcome Categories</Label>
                <div className="flex flex-wrap gap-2">
                  {getNormalizedCategories()
                    .filter(c => c.type === 'outcome')
                    .map((category) => (
                      <div key={`${category.name}-${category.type}`} className="flex items-center gap-2 px-3 py-1 bg-secondary rounded">
                        <span>{category.name}</span>
                        <button
                          onClick={() => removeCategory(category.name, category.type)}
                          className="text-destructive hover:text-destructive/80"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  {getNormalizedCategories().filter(c => c.type === 'outcome').length === 0 && (
                    <span className="text-sm text-muted-foreground">No outcome categories</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pomodoro Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Pomodoro Settings</CardTitle>
          <CardDescription>Configure pomodoro timer rewards</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="pomodoroXP">XP Reward per Pomodoro Session</Label>
            <Input
              id="pomodoroXP"
              type="number"
              min="0"
              value={settings.pomodoroXP || 10}
              onChange={(e) => setSettings({ ...settings, pomodoroXP: Math.max(0, parseInt(e.target.value) || 0) })}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Amount of XP awarded when completing a pomodoro session (default: 10)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Reset Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Reset Stats</CardTitle>
          <CardDescription>Reset your level, XP, coins, and energy to 0</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => setShowResetStatsDialog(true)}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Stats
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

