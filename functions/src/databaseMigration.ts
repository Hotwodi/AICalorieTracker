import * as admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';

/**
 * Migrates user data to ensure proper isolation
 * This function will:
 * 1. Move upload rules into user subcollection
 * 2. Move notifications into user subcollection
 * 3. Ensure all user-specific data is under their user document
 */
export const migrateUserData = onSchedule('0 0 * * *', async (event) => {
    const db = admin.firestore();
    const batch = db.batch();
    const processedUsers: string[] = [];

    try {
        // Get all users
        const usersSnapshot = await db.collection('users').get();

        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            processedUsers.push(userId);

            // 1. Migrate upload rules
            const uploadRulesRef = db.collection('upload_rules').doc(userId);
            const uploadRulesDoc = await uploadRulesRef.get();
            
            if (uploadRulesDoc.exists) {
                const newUploadRulesRef = userDoc.ref.collection('upload_rules').doc('daily');
                batch.set(newUploadRulesRef, uploadRulesDoc.data());
                batch.delete(uploadRulesRef);
            }

            // 2. Create default upload rules if they don't exist
            if (!uploadRulesDoc.exists) {
                const newUploadRulesRef = userDoc.ref.collection('upload_rules').doc('daily');
                batch.set(newUploadRulesRef, {
                    count: 0,
                    date: admin.firestore.Timestamp.now(),
                    lastReset: admin.firestore.Timestamp.now(),
                    userId: userId
                });
            }

            // 3. Migrate notifications
            const notificationsSnapshot = await db.collection('notifications')
                .where('userId', '==', userId)
                .get();

            for (const notifDoc of notificationsSnapshot.docs) {
                const newNotifRef = userDoc.ref.collection('notifications').doc(notifDoc.id);
                batch.set(newNotifRef, notifDoc.data());
                batch.delete(notifDoc.ref);
            }

            // 4. Ensure subscription data is in the right place
            const subscriptionData = userDoc.data().subscription;
            if (subscriptionData) {
                const subscriptionRef = userDoc.ref.collection('subscription').doc('current');
                batch.set(subscriptionRef, {
                    type: subscriptionData,
                    updatedAt: admin.firestore.Timestamp.now()
                });
            }
        }

        // Commit all changes
        await batch.commit();

        console.log(`Successfully migrated data for ${processedUsers.length} users`);
        return { success: true, processedUsers };

    } catch (error) {
        console.error('Error during data migration:', error);
        throw error;
    }
});

/**
 * Validates and fixes user data structure
 */
export const validateUserDataStructure = onSchedule('0 12 * * *', async (event) => {
    const db = admin.firestore();
    const batch = db.batch();
    const processedUsers: string[] = [];

    try {
        const usersSnapshot = await db.collection('users').get();

        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            processedUsers.push(userId);

            // Ensure all required subcollections exist
            const collections = ['upload_rules', 'notifications', 'subscription', 'photos'];
            
            for (const collName of collections) {
                const collRef = userDoc.ref.collection(collName);
                const collDocs = await collRef.limit(1).get();
                
                if (collDocs.empty && collName === 'upload_rules') {
                    // Create default upload rules
                    batch.set(collRef.doc('daily'), {
                        count: 0,
                        date: admin.firestore.Timestamp.now(),
                        lastReset: admin.firestore.Timestamp.now(),
                        userId: userId
                    });
                }
            }

            // Ensure user document has all required fields
            const userData = userDoc.data();
            const updates: any = {};

            if (!userData.subscription) updates.subscription = 'free';
            if (!userData.createdAt) updates.createdAt = admin.firestore.Timestamp.now();
            if (!userData.lastActive) updates.lastActive = admin.firestore.Timestamp.now();
            if (userData.isTestUser === undefined) updates.isTestUser = false;

            if (Object.keys(updates).length > 0) {
                batch.update(userDoc.ref, updates);
            }
        }

        await batch.commit();
        console.log(`Successfully validated data structure for ${processedUsers.length} users`);
        return { success: true, processedUsers };

    } catch (error) {
        console.error('Error during data structure validation:', error);
        throw error;
    }
});
