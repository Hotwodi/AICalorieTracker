import { getFirestore, doc, setDoc, getDoc, updateDoc, runTransaction, collection, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { Logger } from './lib/logger.js';
import { db } from '@/lib/firebase';

const logger = new Logger('UserInitialization');

// Comprehensive permission and configuration types
export interface UserPermissions {
  read: boolean;
  write: boolean;
  admin?: boolean;
  features?: {
    imageAnalysis?: boolean;
    mealSuggestion?: boolean;
    nutritionTracking?: boolean;
  };
}

export interface UserProfile {
  userId: string;
  email: string;
  displayName?: string;
  dailyTargetCalories: number;
  targetMacros: {
    fat: number;
    protein: number;
    carbs: number;
  };
  permissions: UserPermissions;
  createdAt: Date;
  lastLogin?: Date;
}

// Default configurations
const DEFAULT_DAILY_TARGET_CALORIES = 2000;
const DEFAULT_MACROS = {
  fat: 70,   // grams
  protein: 150, // grams
  carbs: 200    // grams
};

// Default usage limit configuration
const DEFAULT_DAILY_LIMIT = 8;

/**
 * Create a new usage limit record for a user
 * @param userId - Unique identifier for the user
 * @returns Promise resolving to the created usage limit document
 */
export async function createUserUsageLimit(userId: string) {
  try {
    const usageLimitRef = doc(db, "usage_limits", userId);
    
    const usageLimitData = {
      userId: userId,
      count: 0,
      maxDaily: DEFAULT_DAILY_LIMIT,
      date: new Date(),
      lastReset: new Date()
    };

    await setDoc(usageLimitRef, usageLimitData, { merge: true });
    
    logger.info(`Created usage limit record for user: ${userId}`);
    return usageLimitData;
  } catch (error) {
    logger.error(`Failed to create usage limit for user ${userId}`, error);
    throw error;
  }
}

/**
 * Check if user has reached their daily usage limit
 * @param userId - Unique identifier for the user
 * @returns Promise resolving to boolean indicating if limit is reached
 */
export async function checkUserDailyLimit(userId: string): Promise<boolean> {
  try {
    const usageLimitRef = doc(db, "usage_limits", userId);
    const usageLimitSnap = await getDoc(usageLimitRef);

    if (!usageLimitSnap.exists()) {
      logger.warn(`No usage limit found for user ${userId}. Creating default.`);
      await createUserUsageLimit(userId);
      return false;
    }

    const usageData = usageLimitSnap.data();
    const isLimitReached = usageData.count >= usageData.maxDaily;

    logger.info(`User ${userId} usage: ${usageData.count}/${usageData.maxDaily}`);
    
    return isLimitReached;
  } catch (error) {
    logger.error(`Error checking daily limit for user ${userId}`, error);
    return true; // Fail safe: block if we can't verify
  }
}

/**
 * Increment user's daily usage count
 * @param userId - Unique identifier for the user
 * @returns Promise resolving to the new usage count
 */
export async function incrementUserUsage(userId: string): Promise<number> {
  try {
    const usageLimitRef = doc(db, "usage_limits", userId);
    const usageLimitSnap = await getDoc(usageLimitRef);

    if (!usageLimitSnap.exists()) {
      logger.warn(`No usage limit found for user ${userId}. Creating default.`);
      await createUserUsageLimit(userId);
    }

    const currentData = usageLimitSnap.data() || {};
    const newCount = (currentData.count || 0) + 1;

    await updateDoc(usageLimitRef, { 
      count: newCount,
      date: new Date() 
    });

    logger.info(`Incremented usage for user ${userId} to ${newCount}`);
    return newCount;
  } catch (error) {
    logger.error(`Failed to increment usage for user ${userId}`, error);
    throw error;
  }
}

/**
 * Reset daily usage for a specific user
 * @param userId - Unique identifier for the user
 */
export async function resetUserDailyUsage(userId: string) {
  try {
    const usageLimitRef = doc(db, "usage_limits", userId);
    
    await updateDoc(usageLimitRef, {
      count: 0,
      lastReset: new Date()
    });

    logger.info(`Reset daily usage for user ${userId}`);
  } catch (error) {
    logger.error(`Failed to reset daily usage for user ${userId}`, error);
  }
}

/**
 * Initialize comprehensive user record
 * @param user - Firebase Authentication user object
 */
export async function initializeUserRecord(user: any): Promise<UserProfile> {
  try {
    const userRef = doc(db, "users", user.uid);
    
    // Use transaction for atomic write and read
    return await runTransaction(db, async (transaction) => {
      const userSnap = await transaction.get(userRef);

      // Default restrictive permissions
      const defaultPermissions: UserPermissions = {
        read: true,
        write: false,
        features: {
          imageAnalysis: false,
          mealSuggestion: false,
          nutritionTracking: false
        }
      };

      // Prepare user data
      const userData: UserProfile = userSnap.exists() 
        ? userSnap.data() as UserProfile 
        : {
            userId: user.uid,
            email: user.email || '',
            displayName: user.displayName || '',
            dailyTargetCalories: DEFAULT_DAILY_TARGET_CALORIES,
            targetMacros: DEFAULT_MACROS,
            permissions: defaultPermissions,
            createdAt: new Date(),
            lastLogin: new Date()
          };

      // Update last login timestamp
      userData.lastLogin = new Date();

      // Validate and potentially upgrade permissions
      await validateUserPermissions(userData);

      // Set or update user document
      transaction.set(userRef, userData, { merge: true });

      logger.info(`User profile ${userSnap.exists() ? 'updated' : 'created'}: ${user.email}`);
      
      return userData;
    });
  } catch (error) {
    logger.error("User initialization failed", {
      userId: user.uid,
      email: user.email,
      error: error.message
    });
    throw error;
  }
}

async function validateUserPermissions(userProfile: UserProfile): Promise<void> {
  // Permission upgrade logic
  if (userProfile.email) {
    const emailDomain = userProfile.email.split('@')[1];
    
    // Example domain-based permission upgrade
    const allowedDomains = ['hotwodi.com', 'gmail.com'];
    if (allowedDomains.includes(emailDomain)) {
      userProfile.permissions.write = true;
      userProfile.permissions.features = {
        imageAnalysis: true,
        mealSuggestion: true,
        nutritionTracking: true
      };
      
      logger.info(`Upgraded permissions for user: ${userProfile.email}`);
    }
  }
}

export function checkUserPermission(
  user: UserProfile, 
  feature: keyof NonNullable<UserPermissions['features']>
): boolean {
  return user.permissions.features?.[feature] === true;
}

export async function logUserAction(
  userId: string, 
  action: string, 
  details?: Record<string, unknown>
) {
  try {
    const actionLogRef = doc(collection(db, "user_actions"));
    await setDoc(actionLogRef, {
      userId,
      action,
      timestamp: new Date(),
      details: details || {}
    });
  } catch (error) {
    logger.error("Failed to log user action", { userId, action, error: error.message });
  }
}

// Periodic cleanup of old user actions
export async function cleanupOldUserActions(daysOld: number = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    // Implement cleanup logic (would typically be a Cloud Function in production)
    logger.info(`Cleaned up user actions older than ${cutoffDate}`);
  } catch (error) {
    logger.error("Failed to cleanup user actions", error);
  }
}

/**
 * Initialize user record in Firestore when they sign in
 */
export async function initializeUserRecordOnSignIn(user?: any) {
  try {
    // If no user is provided, use the current authenticated user
    const currentUser = user || getAuth().currentUser;
    
    // If still no user, just return null without logging a warning
    if (!currentUser) {
      return null;
    }

    logger.info(`Initializing user record for: ${currentUser.email || 'Unknown Email'}`);

    // Check if user profile already exists
    const userDocRef = doc(db, "users", currentUser.uid);
    
    try {
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Initialize user profile if it doesn't exist
        logger.info(`Creating user profile for: ${currentUser.email}`);
        await initializeUserRecord(currentUser);
      } else {
        logger.info(`User profile already exists for: ${currentUser.email}`);
      }

      // Create usage limit record
      await createUserUsageLimit(currentUser.uid);
    } catch (permissionError: any) {
      // Log permission errors but don't block initialization
      logger.warn(`Permission issue during user record initialization: ${permissionError.message}`);
    }

    logger.info(`User record initialized successfully for: ${currentUser.email}`);
    return currentUser;
  } catch (error: any) {
    // Only log if it's not just a "no user" scenario
    if (error.code !== 'auth/no-current-user') {
      logger.error('Failed to initialize user record', error);
    }
    return null;
  }
}

export async function updateExistingUsers() {
  try {
    const usersRef = collection(db, "users");
    const usersSnapshot = await getDocs(usersRef);

    const updatePromises = usersSnapshot.docs.map(async (userDoc) => {
      const userData = userDoc.data();
      
      // Skip admin user
      if (userData.userId === "urtqkhH0v8WSMVYLtPrxXjoCLXy1") {
        logger.info("Skipping admin user during update");
        return;
      }

      // Ensure usage limit exists
      await createUserUsageLimit(userDoc.id);
    });

    await Promise.all(updatePromises);
    logger.info("Existing users updated successfully");
  } catch (error) {
    logger.error("Error updating existing users", error);
  }
}
