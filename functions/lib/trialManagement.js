"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupNewUserTrial = exports.checkExpiredTrials = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
/**
 * Scheduled function that runs daily to check for expired trials
 * and update their upload limits accordingly
 */
exports.checkExpiredTrials = functions.pubsub
    .schedule('every 24 hours')
    .onRun(async (context) => {
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
        const processedUsers = [];
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
    }
    catch (error) {
        console.error('Error processing expired trials:', error);
        throw error;
    }
});
/**
 * Triggered when a user document is created
 * Sets up trial period for new free users
 */
exports.setupNewUserTrial = functions.firestore
    .document('users/{userId}')
    .onCreate(async (snap, context) => {
    const userData = snap.data();
    const userId = context.params.userId;
    // Only set up trial for free users
    if (userData.subscription !== 'free') {
        return null;
    }
    const now = admin.firestore.Timestamp.now();
    const fourteenDaysFromNow = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000));
    const batch = admin.firestore().batch();
    // Update user with trial dates
    batch.update(snap.ref, {
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
    const notificationRef = snap.ref.collection('notifications').doc();
    batch.set(notificationRef, {
        type: 'trial_started',
        title: 'Welcome to Your Free Trial!',
        message: 'You can now upload up to 3 photos per day for the next 14 days. Make the most of it!',
        createdAt: now,
        read: false
    });
    await batch.commit();
    return { success: true, userId };
});
