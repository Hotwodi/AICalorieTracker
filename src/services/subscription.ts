import { db } from '../config/firebase';
import { doc, getDoc, setDoc, updateDoc, runTransaction } from 'firebase/firestore';
import { SubscriptionTier, UserSubscription, SUBSCRIPTION_LIMITS } from '../types/subscription';

export class SubscriptionService {
  private static getUserDocRef(userId: string) {
    return doc(db, 'subscriptions', userId);
  }

  private static async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    const docRef = this.getUserDocRef(userId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() as UserSubscription : null;
  }

  static async initializeBasicSubscription(userId: string): Promise<void> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + SUBSCRIPTION_LIMITS.BASIC_TRIAL_DAYS);

    const subscription: UserSubscription = {
      tier: SubscriptionTier.BASIC,
      startDate,
      endDate,
      dailyImageCount: 0,
      lastImageDate: new Date().toISOString().split('T')[0],
    };

    // Use transaction to ensure atomic write
    await runTransaction(db, async (transaction) => {
      const docRef = this.getUserDocRef(userId);
      const docSnap = await transaction.get(docRef);
      
      // Only initialize if user doesn't already have a subscription
      if (!docSnap.exists()) {
        transaction.set(docRef, subscription);
      }
    });
  }

  static async upgradeToPremium(userId: string): Promise<void> {
    const subscription: Partial<UserSubscription> = {
      tier: SubscriptionTier.PREMIUM,
      endDate: undefined, // Remove end date for premium users
    };

    // Use transaction to ensure atomic update
    await runTransaction(db, async (transaction) => {
      const docRef = this.getUserDocRef(userId);
      const docSnap = await transaction.get(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Subscription not found');
      }
      
      transaction.update(docRef, subscription);
    });
  }

  static async canUploadImage(userId: string): Promise<boolean> {
    // Use transaction to ensure atomic read and update
    return await runTransaction(db, async (transaction) => {
      const docRef = this.getUserDocRef(userId);
      const docSnap = await transaction.get(docRef);
      
      if (!docSnap.exists()) return false;
      
      const subscription = docSnap.data() as UserSubscription;
      const today = new Date().toISOString().split('T')[0];
      
      // Reset daily count if it's a new day
      if (subscription.lastImageDate !== today) {
        transaction.update(docRef, {
          dailyImageCount: 0,
          lastImageDate: today,
        });
        subscription.dailyImageCount = 0;
      }

      // Premium users have unlimited access
      if (subscription.tier === SubscriptionTier.PREMIUM) {
        return true;
      }

      // Check if basic subscription is still valid
      if (subscription.endDate && new Date(subscription.endDate) < new Date()) {
        return false;
      }

      // Check daily limit for basic users
      return subscription.dailyImageCount < SUBSCRIPTION_LIMITS.BASIC_DAILY_IMAGES;
    });
  }

  static async incrementImageCount(userId: string): Promise<void> {
    // Use transaction to ensure atomic update
    await runTransaction(db, async (transaction) => {
      const docRef = this.getUserDocRef(userId);
      const docSnap = await transaction.get(docRef);
      
      if (!docSnap.exists()) return;
      
      const subscription = docSnap.data() as UserSubscription;
      const today = new Date().toISOString().split('T')[0];
      
      if (subscription.lastImageDate !== today) {
        transaction.update(docRef, {
          dailyImageCount: 1,
          lastImageDate: today,
        });
      } else {
        transaction.update(docRef, {
          dailyImageCount: subscription.dailyImageCount + 1,
        });
      }
    });
  }

  static async getSubscriptionStatus(userId: string): Promise<{
    isValid: boolean;
    remainingUploads: number;
    isPremium: boolean;
    trialDaysLeft?: number;
  }> {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription) {
      return { isValid: false, remainingUploads: 0, isPremium: false };
    }

    const isPremium = subscription.tier === SubscriptionTier.PREMIUM;
    
    if (isPremium) {
      return { isValid: true, remainingUploads: Infinity, isPremium: true };
    }

    const today = new Date().toISOString().split('T')[0];
    const currentCount = subscription.lastImageDate === today ? subscription.dailyImageCount : 0;
    const remainingUploads = SUBSCRIPTION_LIMITS.BASIC_DAILY_IMAGES - currentCount;

    const trialDaysLeft = subscription.endDate 
      ? Math.max(0, Math.ceil((new Date(subscription.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    return {
      isValid: !!subscription.endDate && new Date(subscription.endDate) > new Date(),
      remainingUploads,
      isPremium: false,
      trialDaysLeft,
    };
  }
}
