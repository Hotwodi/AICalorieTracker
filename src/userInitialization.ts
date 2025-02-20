import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Logger } from './lib/logger.js';

// Initialize Firestore and Auth
const db = getFirestore();
const auth = getAuth();
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
async function initializeUserProfile(user) {
  try {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    // Create user record if it doesn't exist
    if (!userSnap.exists()) {
      const userData = {
        userId: user.uid,
        email: user.email,
        dailyTargetCalories: DEFAULT_DAILY_TARGET_CALORIES,
        targetMacros: DEFAULT_MACROS,
        createdAt: new Date()
      };

      await setDoc(userRef, userData);
      logger.info(`Created new user profile for ${user.email}`);
    }

    // Ensure usage limit exists
    await createUserUsageLimit(user.uid);

    return userSnap.exists() ? userSnap.data() : null;
  } catch (error) {
    logger.error("Error initializing user profile", error);
    throw error;
  }
}

/**
 * Initialize user record in Firestore when they sign in
 */
export function initializeUserRecord() {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Skip admin user
      if (user.email === "hotwodi4@gmail.com") {
        logger.info("Admin user detected. Skipping Firestore entry.");
        return;
      }

      try {
        await initializeUserProfile(user);
      } catch (error) {
        logger.error("Error in user initialization", error);
      }
    }
  });
}

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

// Initialize user record on module import
initializeUserRecord();
