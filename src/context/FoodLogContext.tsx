import React, { createContext, useState, useContext, useEffect } from 'react';
import { startOfDay, endOfDay } from 'date-fns';

// Interface for a single food item
export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  timestamp: number;
}

// Interface for user's daily macro goals
export interface MacroGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Interface for tracking daily achievements
export interface DailyAchievement {
  date: string; // ISO date string
  achieved: boolean;
}

// Context type
interface FoodLogContextType {
  foodLog: FoodItem[];
  addFoodItem: (item: Omit<FoodItem, 'id' | 'timestamp'>) => void;
  removeFoodItem: (id: string) => void;
  dailyMacroGoals: MacroGoals;
  setDailyMacroGoals: (goals: MacroGoals) => void;
  getTodaysMacroTotals: () => MacroGoals;
  getDayMacroTotals: (date: Date) => MacroGoals;
  achievements: DailyAchievement[];
}

// Create context
const FoodLogContext = createContext<FoodLogContextType | undefined>(undefined);

// Provider component
export const FoodLogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [foodLog, setFoodLog] = useState<FoodItem[]>(() => {
    const savedLog = localStorage.getItem('foodLog');
    return savedLog ? JSON.parse(savedLog) : [];
  });

  const [achievements, setAchievements] = useState<DailyAchievement[]>(() => {
    const savedAchievements = localStorage.getItem('achievements');
    return savedAchievements ? JSON.parse(savedAchievements) : [];
  });

  const [dailyMacroGoals, setDailyMacroGoals] = useState<MacroGoals>(() => {
    const savedGoals = localStorage.getItem('dailyMacroGoals');
    return savedGoals 
      ? JSON.parse(savedGoals) 
      : { calories: 2000, protein: 100, carbs: 250, fat: 65 };
  });

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('foodLog', JSON.stringify(foodLog));
    localStorage.setItem('dailyMacroGoals', JSON.stringify(dailyMacroGoals));
    localStorage.setItem('achievements', JSON.stringify(achievements));
  }, [foodLog, dailyMacroGoals, achievements]);

  // Remove food items older than 24 hours and update achievements
  useEffect(() => {
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
    const filteredLog = foodLog.filter(item => item.timestamp > twentyFourHoursAgo);
    
    if (filteredLog.length !== foodLog.length) {
      setFoodLog(filteredLog);
    }

    // Update achievements for today
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const todaysMacros = getDayMacroTotals(today);
    const achieved = checkGoalsAchieved(todaysMacros);

    setAchievements(prev => {
      const existing = prev.find(a => a.date === todayStr);
      if (existing) {
        return prev.map(a => a.date === todayStr ? { ...a, achieved } : a);
      }
      return [...prev, { date: todayStr, achieved }];
    });
  }, [foodLog, dailyMacroGoals]);

  const addFoodItem = (item: Omit<FoodItem, 'id' | 'timestamp'>) => {
    const newItem: FoodItem = {
      ...item,
      id: `food-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };
    setFoodLog(prevLog => [...prevLog, newItem]);
  };

  const removeFoodItem = (id: string) => {
    setFoodLog(prevLog => prevLog.filter(item => item.id !== id));
  };

  const getDayMacroTotals = (date: Date) => {
    const start = startOfDay(date).getTime();
    const end = endOfDay(date).getTime();
    
    const dayLog = foodLog.filter(item => 
      item.timestamp >= start && item.timestamp <= end
    );

    return dayLog.reduce((totals, item) => ({
      calories: totals.calories + item.calories,
      protein: totals.protein + item.protein,
      carbs: totals.carbs + item.carbs,
      fat: totals.fat + item.fat
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  const getTodaysMacroTotals = () => {
    return getDayMacroTotals(new Date());
  };

  const checkGoalsAchieved = (macros: MacroGoals) => {
    return (
      macros.calories >= dailyMacroGoals.calories * 0.9 &&
      macros.protein >= dailyMacroGoals.protein * 0.9 &&
      macros.carbs >= dailyMacroGoals.carbs * 0.9 &&
      macros.fat >= dailyMacroGoals.fat * 0.9
    );
  };

  return (
    <FoodLogContext.Provider value={{
      foodLog,
      addFoodItem,
      removeFoodItem,
      dailyMacroGoals,
      setDailyMacroGoals,
      getTodaysMacroTotals,
      getDayMacroTotals,
      achievements
    }}>
      {children}
    </FoodLogContext.Provider>
  );
};

// Custom hook to use the FoodLog context
export const useFoodLog = () => {
  const context = useContext(FoodLogContext);
  if (context === undefined) {
    throw new Error('useFoodLog must be used within a FoodLogProvider');
  }
  return context;
};
