export enum SubscriptionTier {
  FREE = 'free',
  PREMIUM = 'premium'
}

export interface SubscriptionFeatures {
  maxMealPlans: number;
  customMealPlanning: boolean;
  aiNutritionAnalysis: boolean;
  exportData: boolean;
  mealReminders: boolean;
  progressAnalytics: boolean;
  prioritySupport: boolean;
  shoppingListGeneration: boolean;
  restaurantGuidance: boolean;
  maxPhotoUploadsPerDay: number;
}

export const subscriptionPlans: Record<SubscriptionTier, {
  name: string;
  price: number;
  features: SubscriptionFeatures;
  description: string;
}> = {
  [SubscriptionTier.FREE]: {
    name: 'Free',
    price: 0,
    description: 'Get started with basic nutrition tracking (3 photos/day for 14 days)',
    features: {
      maxMealPlans: 1,
      customMealPlanning: false,
      aiNutritionAnalysis: true,
      exportData: false,
      mealReminders: false,
      progressAnalytics: false,
      prioritySupport: false,
      shoppingListGeneration: false,
      restaurantGuidance: false,
      maxPhotoUploadsPerDay: 3
    }
  },
  [SubscriptionTier.PREMIUM]: {
    name: 'Premium',
    price: 49.99,
    description: 'Complete solution with advanced features (8 photos/day)',
    features: {
      maxMealPlans: -1, // Unlimited
      customMealPlanning: true,
      aiNutritionAnalysis: true,
      exportData: true,
      mealReminders: true,
      progressAnalytics: true,
      prioritySupport: true,
      shoppingListGeneration: true,
      restaurantGuidance: true,
      maxPhotoUploadsPerDay: 8
    }
  }
}
