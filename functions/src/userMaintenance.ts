import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

// Ensure Firebase Admin is initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const logger = admin.logger;

/**
 * Cloud Function to reset daily usage limits for all users
 * Runs daily at midnight
 */
export const performUserMaintenance = onSchedule('0 0 * * *', async (event) => {
  try {
    logger.info('Starting daily user maintenance', { event });

    // Fetch all usage limit documents
    const usageLimitsSnapshot = await db.collection('usage_limits').get();
    
    const resetPromises = usageLimitsSnapshot.docs.map(async (doc) => {
      const userData = doc.data();
      
      // Skip admin user
      if (userData.userId === 'urtqkhH0v8WSMVYLtPrxXjoCLXy1') {
        logger.info('Skipping admin user during daily reset');
        return;
      }

      try {
        // Reset daily usage count
        await doc.ref.update({
          count: 0,
          lastReset: admin.firestore.FieldValue.serverTimestamp()
        });

        logger.info(`Reset daily usage for user: ${doc.id}`);
      } catch (userResetError) {
        logger.error(`Failed to reset usage for user ${doc.id}`, userResetError);
      }
    });

    // Wait for all reset operations to complete
    await Promise.all(resetPromises);

    logger.info('Daily user maintenance completed successfully');
    return { success: true };
  } catch (error) {
    logger.error('Error during daily user maintenance', error);
    throw error;
  }
});

/**
 * Cloud Function to validate user records on creation
 * Ensures each new user has a usage limit record
 */
export const validateUserOnCreate = onDocumentCreated('users/{userId}', async (event) => {
  const userId = event.params.userId;
  const userData = event.data?.data();
  
  try {
    // Skip admin user
    if (userData.email === 'hotwodi4@gmail.com') {
      logger.info('Admin user detected. Skipping usage limit creation.');
      return null;
    }

    const usageLimitRef = db.collection('usage_limits').doc(userId);
    
    // Create usage limit record if it doesn't exist
    await usageLimitRef.set({
      userId: userId,
      count: 0,
      maxDaily: 8, // Default daily limit
      date: admin.firestore.FieldValue.serverTimestamp(),
      lastReset: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    logger.info(`Created usage limit record for new user: ${userId}`);
    return { success: true };
  } catch (error) {
    logger.error(`Error creating usage limit for new user ${userId}`, error);
    throw error;
  }
});
