export enum SubscriptionTier {
  BASIC = 'basic',
  PREMIUM = 'premium'
}

export interface UserSubscription {
  tier: SubscriptionTier;
  startDate: Date;
  endDate?: Date; // For basic tier (14 days trial)
  dailyImageCount: number; // Track daily image uploads
  lastImageDate: string; // To reset counter daily
}

export interface SubscriptionLimits {
  BASIC_DAILY_IMAGES: number;
  BASIC_TRIAL_DAYS: number;
}

export const SUBSCRIPTION_LIMITS: SubscriptionLimits = {
  BASIC_DAILY_IMAGES: 8,
  BASIC_TRIAL_DAYS: 14,
};
