import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { Logger } from './lib/logger.js';
import { db } from '@/lib/firebase';

const logger = new Logger('UserInitialization');

// Default usage limit configuration
const DEFAULT_DAILY_LIMIT = 8;

// Default configuration
const DEFAULT_DAILY_TARGET_CALORIES = 2000;
const DEFAULT_MACROS = {
  fat: 70,   // grams
  protein: 150, // grams
  carbs: 200    // grams
};

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
export async function initializeUserRecord(user) {
  if (!user || !user.uid) {
    logger.error('Invalid user object for initialization');
    return null;
  }

  try {
    const userRef = doc(db, "users", user.uid);
    
    logger.info(`Initializing user record for: ${user.email} (${user.uid})`);

    // Check if user document already exists
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const userData = {
        userId: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        dailyTargetCalories: DEFAULT_DAILY_TARGET_CALORIES,
        targetMacros: DEFAULT_MACROS,
        createdAt: new Date(),
        lastLogin: new Date(),
        permissions: {
          read: true,
          write: true,
          admin: false
        }
      };

      try {
        await setDoc(userRef, userData, { merge: true });
        logger.info(`Created new user profile for ${user.email}`);
      } catch (setError) {
        logger.error('Failed to create user document', {
          errorCode: setError.code,
          errorMessage: setError.message,
          userId: user.uid
        });
        throw setError;
      }
    } else {
      // Update last login time for existing users
      try {
        await updateDoc(userRef, {
          lastLogin: new Date()
        });
      } catch (updateError) {
        logger.warn('Could not update last login time', {
          errorCode: updateError.code,
          errorMessage: updateError.message,
          userId: user.uid
        });
      }
    }

    // Ensure usage limit exists
    await createUserUsageLimit(user.uid);

    return userSnap.exists() ? userSnap.data() : null;
  } catch (error) {
    logger.error('Comprehensive error in user initialization', {
      errorCode: error.code,
      errorMessage: error.message,
      userId: user?.uid,
      email: user?.email
    });
    
    // Rethrow to allow caller to handle
    throw error;
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

/**
 * Initialize user record on module import
 */

// Export for use in other modules
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
