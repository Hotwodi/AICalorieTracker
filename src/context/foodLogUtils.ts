import { FoodLogEntry, MealData } from './utils';

// Define the MacroTotals type
export interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Function to calculate macro totals
export const calculateMacroTotals = (entries: FoodLogEntry[]): MacroTotals => {
  return {
    calories: entries.reduce((total, entry) => total + entry.calories, 0),
    protein: entries.reduce((total, entry) => total + entry.protein, 0),
    carbs: entries.reduce((total, entry) => total + entry.carbs, 0),
    fat: entries.reduce((total, entry) => total + entry.fat, 0),
  };
};

// Function to get macro totals for a meal
export const getMacroTotalsForMeal = (mealData: MealData): MacroTotals => {
  return {
    calories: mealData.calories,
    protein: mealData.protein,
    carbs: mealData.carbs,
    fat: mealData.fat,
  };
};

// Function to get macro totals for a food log entry
export const getMacroTotalsForFoodLogEntry = (entry: FoodLogEntry): MacroTotals => {
  return {
    calories: entry.calories,
    protein: entry.protein,
    carbs: entry.carbs,
    fat: entry.fat,
  };
};
