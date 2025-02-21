import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp, addDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';

// Define interfaces for nutrition data and suggestions
export interface NutritionEntry {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  date: string;
}

export interface MealSuggestion {
  id?: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'late-night';
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  reason: string;
  timestamp: number;
}

export class MealSuggestionService {
  private static DAILY_GOALS = {
    calories: 2000,
    protein: 100,
    carbs: 200,
    fat: 70
  };

  // Determine appropriate meal suggestions based on time of day
  static generateTimedSuggestions(hour: number): MealSuggestion[] {
    const suggestions: MealSuggestion[] = [];
    const now = new Date();

    // Early morning (6-9 AM): Breakfast suggestions
    if (hour >= 6 && hour < 9) {
      suggestions.push({
        type: 'breakfast',
        name: 'Protein-Packed Overnight Oats',
        calories: 350,
        protein: 20,
        carbs: 40,
        fat: 10,
        reason: 'Energizing morning breakfast',
        timestamp: now.getTime()
      }, {
        type: 'breakfast',
        name: 'Veggie and Egg White Frittata',
        calories: 250,
        protein: 25,
        carbs: 10,
        fat: 12,
        reason: 'Balanced start to the day',
        timestamp: now.getTime()
      });
    }
    // Morning to Afternoon (9 AM - 2 PM): Light meals and snacks
    else if (hour >= 9 && hour < 14) {
      suggestions.push({
        type: 'snack',
        name: 'Greek Yogurt Parfait',
        calories: 200,
        protein: 15,
        carbs: 20,
        fat: 8,
        reason: 'Midmorning protein boost',
        timestamp: now.getTime()
      }, {
        type: 'lunch',
        name: 'Grilled Chicken Salad',
        calories: 400,
        protein: 35,
        carbs: 15,
        fat: 20,
        reason: 'Lean protein and fresh vegetables',
        timestamp: now.getTime()
      });
    }
    // Afternoon to Evening (2 PM - 7 PM): Substantial meals
    else if (hour >= 14 && hour < 19) {
      suggestions.push({
        type: 'lunch',
        name: 'Quinoa Power Bowl',
        calories: 450,
        protein: 25,
        carbs: 50,
        fat: 15,
        reason: 'Balanced afternoon meal',
        timestamp: now.getTime()
      }, {
        type: 'snack',
        name: 'Protein Smoothie',
        calories: 250,
        protein: 20,
        carbs: 30,
        fat: 5,
        reason: 'Afternoon energy boost',
        timestamp: now.getTime()
      });
    }
    // Evening (7 PM - 10 PM): Lighter dinner options
    else if (hour >= 19 && hour < 22) {
      suggestions.push({
        type: 'dinner',
        name: 'Baked Salmon with Roasted Vegetables',
        calories: 400,
        protein: 30,
        carbs: 20,
        fat: 22,
        reason: 'Light and nutritious evening meal',
        timestamp: now.getTime()
      }, {
        type: 'dinner',
        name: 'Turkey and Vegetable Stir-Fry',
        calories: 350,
        protein: 25,
        carbs: 30,
        fat: 12,
        reason: 'Low-calorie, high-protein dinner',
        timestamp: now.getTime()
      });
    }
    // Late Night (10 PM - 6 AM): Very light, low-calorie options
    else {
      suggestions.push({
        type: 'late-night',
        name: 'Herbal Tea with Cottage Cheese',
        calories: 150,
        protein: 15,
        carbs: 5,
        fat: 5,
        reason: 'Light late-night protein',
        timestamp: now.getTime()
      }, {
        type: 'late-night',
        name: 'Small Fruit and Nut Portion',
        calories: 100,
        protein: 3,
        carbs: 15,
        fat: 5,
        reason: 'Minimal late-night snacking',
        timestamp: now.getTime()
      });
    }

    return suggestions;
  }

  // Schedule and store suggestions
  static async scheduleDailySuggestions(user: User) {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Generate suggestions for current time
    const suggestions = this.generateTimedSuggestions(currentHour);
    
    // Store suggestions in Firestore for the user
    if (suggestions.length > 0) {
      const suggestionsRef = collection(db, 'meal_suggestions');
      await Promise.all(suggestions.map(suggestion => 
        addDoc(suggestionsRef, {
          userId: user.uid,
          date: now.toISOString().split('T')[0],
          ...suggestion
        })
      ));
    }
  }

  // Fetch recent suggestions (within 2 hours)
  static async fetchRecentSuggestions(user: User): Promise<MealSuggestion[]> {
    try {
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      const suggestionsRef = collection(db, 'meal_suggestions');
      const q = query(
        suggestionsRef, 
        where('userId', '==', user.uid),
        where('date', '==', now.toISOString().split('T')[0]),
        where('timestamp', '>=', twoHoursAgo.getTime())
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MealSuggestion));
    } catch (error) {
      console.error('Error fetching recent meal suggestions:', error);
      return [];
    }
  }
}
