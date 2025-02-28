// Utility functions

// Define the type for a food log entry
export interface FoodLogEntry {
  id?: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  date: string;
  ingredients: string[];
}

// Define the type for daily macro goals
export interface DailyMacroGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Define the type for meal data
export interface MealData {
  name: string;
  ingredients: string[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Define the type for meal analysis results
export interface MealAnalysis {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  // Add any other relevant fields
}

export const someUtilityFunction = () => {
  // Function logic...
};

// Function to calculate today's macro totals
export const getTodaysMacroTotals = (foodLog: FoodLogEntry[]) => {
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

// Function to analyze a meal and log it
export const analyzeMealAndLog = (mealData: MealData) => {
  console.log('Analyzing meal data:', mealData);
  // Logic to analyze meal data and return results
  return {
    calories: mealData.calories,
    protein: mealData.protein,
    carbs: mealData.carbs,
    fat: mealData.fat,
  };
};

// Function to calculate macro totals
export const calculateMacroTotals = (entries: FoodLogEntry[]) => {
  return {
    calories: entries.reduce((total, entry) => total + entry.calories, 0),
    protein: entries.reduce((total, entry) => total + entry.protein, 0),
    carbs: entries.reduce((total, entry) => total + entry.carbs, 0),
    fat: entries.reduce((total, entry) => total + entry.fat, 0),
  };
};

// Function to get macro totals for a meal
export const getMacroTotalsForMeal = (mealData: MealData) => {
  return {
    calories: mealData.calories,
    protein: mealData.protein,
    carbs: mealData.carbs,
    fat: mealData.fat,
  };
};

// Function to get macro totals for a food log entry
export const getMacroTotalsForFoodLogEntry = (entry: FoodLogEntry) => {
  return {
    calories: entry.calories,
    protein: entry.protein,
    carbs: entry.carbs,
    fat: entry.fat,
  };
};
