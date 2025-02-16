import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Ensure Firebase Admin is initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const logger = functions.logger;

// Food suggestions mapping
const foodSuggestions = {
  fat: ["Avocado", "Nuts", "Olive Oil"],
  protein: ["Chicken", "Eggs", "Tofu"],
  carbs: ["Quinoa", "Sweet Potatoes", "Brown Rice"],
};

/**
 * Generate nutrient recommendations for a user
 * @param userId - User's unique identifier
 */
export const generateNutrientRecommendations = functions.pubsub
  .schedule('every day at 6:00 am')
  .timeZone('America/Chicago')
  .onRun(async (context) => {
    try {
      // Get all users
      const usersSnapshot = await db.collection('users').get();

      const recommendationPromises = usersSnapshot.docs.map(async (userDoc) => {
        const userId = userDoc.id;
        
        // Skip admin user
        if (userId === 'urtqkhH0v8WSMVYLtPrxXjoCLXy1') {
          return;
        }

        // Get user data and daily target
        const userData = userDoc.data();
        if (!userData.targetMacros) {
          logger.warn(`No target macros for user ${userId}`);
          return;
        }

        // Calculate yesterday's date
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const dateStr = yesterday.toISOString().split('T')[0];

        // Get yesterday's calendar entry
        const calendarRef = db.doc(`users/${userId}/calendar/${dateStr}`);
        const calendarDoc = await calendarRef.get();

        if (!calendarDoc.exists) {
          logger.info(`No calendar data for user ${userId} on ${dateStr}`);
          return;
        }

        const dailyData = calendarDoc.data();
        const missingNutrients: {[key: string]: number} = {};
        const targetMacros = userData.targetMacros;
        const dailyMacros = dailyData?.dailyMacros || {};

        // Compare intake vs. target
        Object.keys(targetMacros).forEach((macro) => {
          if ((dailyMacros[macro] || 0) < targetMacros[macro]) {
            missingNutrients[macro] = targetMacros[macro] - (dailyMacros[macro] || 0);
          }
        });

        // Generate food suggestions
        const suggestedFoods: string[] = [];
        Object.keys(missingNutrients).forEach((macro) => {
          suggestedFoods.push(
            foodSuggestions[macro as keyof typeof foodSuggestions][
              Math.floor(Math.random() * 3)
            ]
          );
        });

        // Save recommendations
        const recommendationsRef = db.doc(`users/${userId}/recommendations/${dateStr}`);
        await recommendationsRef.set({
          date: dateStr,
          missingNutrients,
          suggestedFoods,
        });

        logger.info(`Recommendations saved for ${userId}:`, suggestedFoods);
      });

      await Promise.all(recommendationPromises);

      return null;
    } catch (error) {
      logger.error('Error generating nutrient recommendations', error);
      return null;
    }
  });
