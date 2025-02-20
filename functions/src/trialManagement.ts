import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

/**
 * Scheduled function that runs daily to check for expired trials
 * and update their upload limits accordingly
 */
export const checkExpiredTrials = onSchedule('0 0 * * *', async (event) => {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();

    try {
      // Get all free users whose trial is ending
      const expiredTrialsSnapshot = await db
        .collection('users')
        .where('subscription', '==', 'free')
        .where('freeTrialPhotoUploadsEndDate', '<=', now)
        .get();

      if (expiredTrialsSnapshot.empty) {
        console.log('No trials expiring today');
        return null;
      }

      const batch = db.batch();
      const processedUsers: string[] = [];

      for (const doc of expiredTrialsSnapshot.docs) {
        const userId = doc.id;
        processedUsers.push(userId);

        // Update user document
        batch.update(doc.ref, {
          maxPhotoUploadsPerDay: 0,
          trialExpired: true,
          trialExpiredAt: now
        });

        // Update their upload rules
        const uploadRuleRef = db.collection('upload_rules').doc(userId);
        batch.update(uploadRuleRef, {
          maxDaily: 0,
          count: 0,
          lastReset: now,
          date: now
        });

        // Add notification about trial expiry
        const notificationRef = db
          .collection('users')
          .doc(userId)
          .collection('notifications')
          .doc();

        batch.set(notificationRef, {
          type: 'trial_expired',
          title: 'Free Trial Ended',
          message: 'Your 14-day free trial has ended. Upgrade to Premium to continue uploading photos and accessing all features!',
          createdAt: now,
          read: false,
          actionUrl: '/upgrade'
        });
      }

      await batch.commit();

      console.log(`Successfully processed ${processedUsers.length} expired trials`);
      return { processedUsers };

    } catch (error) {
      console.error('Error processing expired trials:', error);
      throw error;
    }
});

/**
 * Triggered when a user document is created
 * Sets up trial period for new free users
 */
export const setupNewUserTrial = onDocumentCreated('users/{userId}', async (event) => {
    const userData = event.data?.data();
    const userId = event.params.userId;

    if (!userData || userData.subscription !== 'free') {
      return null;
    }

    const now = admin.firestore.Timestamp.now();
    const fourteenDaysFromNow = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    );

    const batch = admin.firestore().batch();

    // Update user with trial dates
    batch.update(event.data?.ref, {
      freeTrialStartDate: now,
      freeTrialPhotoUploadsEndDate: fourteenDaysFromNow,
      maxPhotoUploadsPerDay: 3
    });

    // Create upload rules document
    const uploadRulesRef = admin.firestore()
      .collection('upload_rules')
      .doc(userId);

    batch.set(uploadRulesRef, {
      count: 0,
      date: now,
      lastReset: now,
      maxDaily: 3,
      userId: userId
    });

    // Add welcome notification
    const notificationRef = event.data?.ref.collection('notifications').doc();
    if (notificationRef) {
      batch.set(notificationRef, {
        type: 'trial_started',
        title: 'Welcome to Your Free Trial!',
        message: 'You can now upload up to 3 photos per day for the next 14 days. Make the most of it!',
        createdAt: now,
        read: false
      });
    }

    await batch.commit();
    return { success: true, userId };
});
