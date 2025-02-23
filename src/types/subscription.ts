export enum SubscriptionTier {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM'
}

export interface SubscriptionStatus {
  isValid: boolean;
  remainingUploads: number;
  isPremium: boolean;
  trialDaysLeft?: number;
  tier: SubscriptionTier;
} 