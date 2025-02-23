import React, { createContext, useState, useContext, ReactNode } from 'react';

// Define the type for a food log entry
export interface FoodLogEntry {
  id?: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  date: string;
}

// Define the type for daily macro goals
export interface DailyMacroGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Define the context type
interface FoodLogContextType {
  foodLog: FoodLogEntry[];
  dailyMacroGoals: DailyMacroGoals;
  setDailyMacroGoals: (goals: DailyMacroGoals) => void;
  addFoodLogEntry: (entry: FoodLogEntry) => void;
  addManualFoodEntry: (entry: Omit<FoodLogEntry, 'id' | 'date'>) => void;
  removeFoodLogEntry: (id: string) => void;
  updateFoodLogEntry: (entry: FoodLogEntry) => void;
  getTodaysMacroTotals: () => {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

// Create the context
const FoodLogContext = createContext<FoodLogContextType | undefined>(undefined);

// Create a provider component
export const FoodLogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [foodLog, setFoodLog] = useState<FoodLogEntry[]>([]);
  const [dailyMacroGoals, setDailyMacroGoals] = useState<DailyMacroGoals>({
    calories: 2000,
    protein: 100,
    carbs: 250,
    fat: 70
  });

  const addFoodLogEntry = (entry: FoodLogEntry) => {
    console.log('Adding food log entry:', entry);
    setFoodLog(prevLog => {
      const updatedLog = [...prevLog, { ...entry, id: Date.now().toString() }];
      console.log('Updated food log:', updatedLog);
      return updatedLog;
    });
  };

  const addManualFoodEntry = (entry: Omit<FoodLogEntry, 'id' | 'date'>) => {
    const fullEntry: FoodLogEntry = {
      ...entry,
      id: Date.now().toString(),
      date: new Date().toISOString()
    };
    addFoodLogEntry(fullEntry);
  };

  const removeFoodLogEntry = (id: string) => {
    setFoodLog(prevLog => prevLog.filter(entry => entry.id !== id));
  };

  const updateFoodLogEntry = (updatedEntry: FoodLogEntry) => {
    setFoodLog(prevLog => 
      prevLog.map(entry => 
        entry.id === updatedEntry.id ? updatedEntry : entry
      )
    );
  };

  const getTodaysMacroTotals = () => {
    const today = new Date().toISOString().split('T')[0];
    const todaysEntries = foodLog.filter(entry => 
      new Date(entry.date).toISOString().split('T')[0] === today
    );

    return todaysEntries.reduce((totals, entry) => ({
      calories: totals.calories + entry.calories,
      protein: totals.protein + entry.protein,
      carbs: totals.carbs + entry.carbs,
      fat: totals.fat + entry.fat
    }), {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    });
  };

  return (
    <FoodLogContext.Provider value={{ 
      foodLog, 
      dailyMacroGoals,
      setDailyMacroGoals,
      addFoodLogEntry, 
      addManualFoodEntry,
      removeFoodLogEntry, 
      updateFoodLogEntry,
      getTodaysMacroTotals
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
