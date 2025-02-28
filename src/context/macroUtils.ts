import { FoodLogEntry, MealData } from './utils';

export const calculateMacroTotals = (entries: FoodLogEntry[]): { calories: number; protein: number; carbs: number; fat: number; } => {
  return {
    calories: entries.reduce((total, entry) => total + (entry.calories || 0), 0),
    protein: entries.reduce((total, entry) => total + (entry.protein || 0), 0),
    carbs: entries.reduce((total, entry) => total + (entry.carbs || 0), 0),
    fat: entries.reduce((total, entry) => total + (entry.fat || 0), 0),
  };
};

export const getMacroTotalsForMeal = (mealData: MealData): { calories: number; protein: number; carbs: number; fat: number; } => {
  return {
    calories: mealData.calories || 0,
    protein: mealData.protein || 0,
    carbs: mealData.carbs || 0,
    fat: mealData.fat || 0,
  };
};
