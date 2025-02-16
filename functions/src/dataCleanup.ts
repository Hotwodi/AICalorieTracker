import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Ensure Firebase Admin is initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const RETENTION_DAYS = 90; // Keep meal data for 90 days
const RECOMMENDATION_RETENTION_DAYS = 7; // Keep recommendations for 7 days

/**
 * Clean up old meal data for a specific user
 * @param userId - User's unique identifier
 */
async function cleanOldMealData(userId: string) {
  try {
    const mealsRef = db.collection(`users/${userId}/meals`);
    const today = new Date();

    const oldMealsQuery = mealsRef.where('timestamp', '<', new Date(today.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000));
    const mealsSnapshot = await oldMealsQuery.get();

    const batch = db.batch();
    mealsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    functions.logger.log(`Cleaned ${mealsSnapshot.size} old meals for user ${userId}`);
  } catch (error) {
    functions.logger.error('Error cleaning old meal data', { userId, error });
  }
}

/**
 * Clean up old recommendations
 * @param userId - User's unique identifier
 */
async function cleanOldRecommendations(userId: string) {
  try {
    const recommendationsRef = db.collection(`users/${userId}/recommendations`);
    const today = new Date();

    const oldRecommendationsQuery = recommendationsRef.where('date', '<', new Date(today.getTime() - RECOMMENDATION_RETENTION_DAYS * 24 * 60 * 60 * 1000));
    const recommendationsSnapshot = await oldRecommendationsQuery.get();

    const batch = db.batch();
    recommendationsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    functions.logger.log(`Cleaned ${recommendationsSnapshot.size} old recommendations for user ${userId}`);
  } catch (error) {
    functions.logger.error('Error cleaning old recommendations', { userId, error });
  }
}

/**
 * Cloud Function to perform daily data cleanup
 * Runs every day to remove old data
 */
export const performDataCleanup = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    try {
      // Fetch all users
      const usersSnapshot = await db.collection('users').get();

      const cleanupPromises = usersSnapshot.docs.map(async (userDoc) => {
        const userId = userDoc.id;

        // Skip admin user
        if (userId === 'urtqkhH0v8WSMVYLtPrxXjoCLXy1') {
          return;
        }

        await cleanOldMealData(userId);
        await cleanOldRecommendations(userId);
      });

      await Promise.all(cleanupPromises);

      functions.logger.log('Daily data cleanup completed successfully');
      return null;
    } catch (error) {
      functions.logger.error('Error during daily data cleanup', error);
      return null;
    }
  });
