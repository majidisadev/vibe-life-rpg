import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Award, Sparkles, Coins, Zap } from 'lucide-react';
import api from '../lib/api';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const previousUserRef = useRef(null);
  const isInitialLoadRef = useRef(true);

  const showStatToasts = (newUser, prevUser) => {
    if (!prevUser || !newUser) return;

    // Check for level up (must check first before XP comparison)
    if (newUser.level > prevUser.level) {
      toast.success("Level Up!", {
        description: `Selamat! Anda naik ke level ${newUser.level}!`,
        icon: <Award className="h-5 w-5" />,
      });
    }

    // Check for XP changes
    if (newUser.xp !== prevUser.xp) {
      const xpDiff = newUser.xp - prevUser.xp;
      if (xpDiff > 0) {
        toast.success("XP Bertambah!", {
          description: `+${xpDiff} XP`,
          icon: <Sparkles className="h-5 w-5" />,
        });
      } else if (xpDiff < 0) {
        toast.error("XP Berkurang", {
          description: `${xpDiff} XP`,
          icon: <Sparkles className="h-5 w-5" />,
        });
      }
    }

    // Check for coins changes
    if (newUser.coins !== prevUser.coins) {
      const coinsDiff = newUser.coins - prevUser.coins;
      if (coinsDiff > 0) {
        toast.success("Coins Bertambah!", {
          description: `+${coinsDiff} Coins`,
          icon: <Coins className="h-5 w-5" />,
        });
      } else if (coinsDiff < 0) {
        toast.error("Coins Berkurang", {
          description: `${coinsDiff} Coins`,
          icon: <Coins className="h-5 w-5" />,
        });
      }
    }

    // Check for energy changes
    if (newUser.energy !== prevUser.energy) {
      const energyDiff = newUser.energy - prevUser.energy;
      if (energyDiff > 0) {
        toast.success("Energy Bertambah!", {
          description: `+${energyDiff} Energy`,
          icon: <Zap className="h-5 w-5" />,
        });
      } else if (energyDiff < 0) {
        toast.warning("Energy Berkurang", {
          description: `${energyDiff} Energy`,
          icon: <Zap className="h-5 w-5" />,
        });
      }
    }
  };

  const loadUser = async (showToasts = true) => {
    try {
      const res = await api.get('/user');
      const newUser = res.data;
      
      // Show toasts if not initial load and showToasts is true
      if (!isInitialLoadRef.current && showToasts && previousUserRef.current) {
        showStatToasts(newUser, previousUserRef.current);
      }
      
      setUser(newUser);
      previousUserRef.current = newUser;
      applyTheme(newUser?.settings?.theme);
      applyDarkMode(newUser?.settings?.darkMode);
      
      // Mark initial load as complete after first load
      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false;
      }
      
      return newUser;
    } catch (error) {
      console.error('Error loading user data:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (updates) => {
    try {
      const res = await api.put('/user', updates);
      const newUser = res.data;
      
      // Show toasts when user is updated
      if (previousUserRef.current) {
        showStatToasts(newUser, previousUserRef.current);
      }
      
      setUser(newUser);
      previousUserRef.current = newUser;
      applyTheme(newUser?.settings?.theme);
      applyDarkMode(newUser?.settings?.darkMode);
      return newUser;
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  };

  const applyTheme = (theme) => {
    const value = theme && ['spring', 'summer', 'autumn', 'winter'].includes(theme) ? theme : 'spring';
    document.documentElement.setAttribute('data-theme', value);
  };

  const applyDarkMode = (darkMode) => {
    if (darkMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const refreshUser = async (showToasts = true) => {
    return await loadUser(showToasts);
  };

  useEffect(() => {
    loadUser(false); // Don't show toasts on initial load
    // Refresh user data every 30 seconds as fallback
    const interval = setInterval(() => loadUser(true), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user) {
      applyTheme(user.settings?.theme);
      applyDarkMode(user.settings?.darkMode);
    } else {
      document.documentElement.setAttribute('data-theme', 'spring');
      document.documentElement.classList.remove('dark');
    }
  }, [user]);

  return (
    <UserContext.Provider value={{ user, loading, loadUser, updateUser, refreshUser, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}

