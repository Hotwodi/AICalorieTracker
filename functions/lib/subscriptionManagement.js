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
exports.checkExpiredSubscriptions = exports.cancelSubscription = exports.updateSubscription = exports.validateSubscriptionAccess = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Ensure Firebase Admin is initialized
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
const logger = functions.logger;
/**
 * Validates a user's subscription status and features
 */
exports.validateSubscriptionAccess = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    try {
        const userDoc = await db.collection('users').doc(context.auth.uid).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'User not found');
        }
        const userData = userDoc.data();
        const subscription = userData.subscription;
        if (!subscription) {
            return { tier: 'free', isValid: true, features: getDefaultFeatures() };
        }
        // Check if subscription is expired
        const isExpired = subscription.endDate && subscription.endDate.toDate() < new Date();
        return {
            tier: subscription.tier,
            isValid: !isExpired,
            features: subscription.features
        };
    }
    catch (error) {
        logger.error('Error validating subscription:', error);
        throw new functions.https.HttpsError('internal', 'Error validating subscription');
    }
});
/**
 * Updates user's subscription when payment is successful
 */
exports.updateSubscription = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    const { tier, paymentId } = data;
    if (!tier || !paymentId) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }
    try {
        // Here you would typically validate the payment with your payment processor
        // await validatePayment(paymentId);
        const userRef = db.collection('users').doc(context.auth.uid);
        // Calculate subscription end date (30 days from now)
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);
        await userRef.update({
            'subscription.tier': tier,
            'subscription.startDate': admin.firestore.FieldValue.serverTimestamp(),
            'subscription.endDate': admin.firestore.Timestamp.fromDate(endDate),
            'subscription.features': getFeatures(tier),
            'subscription.autoRenew': true,
            'subscription.lastPaymentId': paymentId
        });
        return { success: true };
    }
    catch (error) {
        logger.error('Error updating subscription:', error);
        throw new functions.https.HttpsError('internal', 'Error updating subscription');
    }
});
/**
 * Handles subscription cancellation
 */
exports.cancelSubscription = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    try {
        const userRef = db.collection('users').doc(context.auth.uid);
        await userRef.update({
            'subscription.autoRenew': false
        });
        return { success: true };
    }
    catch (error) {
        logger.error('Error canceling subscription:', error);
        throw new functions.https.HttpsError('internal', 'Error canceling subscription');
    }
});
/**
 * Scheduled function to check and update expired subscriptions
 */
exports.checkExpiredSubscriptions = functions.pubsub
    .schedule('every 24 hours')
    .onRun(async (context) => {
    try {
        const now = admin.firestore.Timestamp.now();
        // Query for expired subscriptions
        const expiredSubscriptionsSnapshot = await db
            .collection('users')
            .where('subscription.endDate', '<=', now)
            .where('subscription.autoRenew', '==', true)
            .get();
        const updatePromises = expiredSubscriptionsSnapshot.docs.map(async (doc) => {
            const userData = doc.data();
            try {
                // Here you would typically attempt to charge the user's payment method
                // const paymentSuccess = await processRenewalPayment(userData);
                // For now, we'll just mark as expired
                await doc.ref.update({
                    'subscription.tier': 'free',
                    'subscription.features': getDefaultFeatures(),
                    'subscription.autoRenew': false
                });
                logger.info(`Updated expired subscription for user: ${doc.id}`);
            }
            catch (updateError) {
                logger.error(`Failed to update expired subscription for user ${doc.id}`, updateError);
            }
        });
        await Promise.all(updatePromises);
        logger.info('Expired subscriptions check completed');
        return null;
    }
    catch (error) {
        logger.error('Error checking expired subscriptions:', error);
        return null;
    }
});
function getTierFromProductId(productId) {
    const productMap = {
        'com.softaidev.aicalorietracker.premium': 'premium'
    };
    return productMap[productId] || 'free';
}
/**
 * Get default features for free tier
 */
function getDefaultFeatures() {
    return {
        maxMealPlans: 1,
        customMealPlanning: false,
        aiNutritionAnalysis: true,
        exportData: false,
        mealReminders: false,
        progressAnalytics: false,
        prioritySupport: false,
        shoppingListGeneration: false,
        restaurantGuidance: false,
        maxPhotoUploadsPerDay: 5
    };
}
/**
 * Get features for a specific tier
 */
function getFeatures(tier) {
    switch (tier) {
        case 'premium':
            return {
                maxMealPlans: -1,
                customMealPlanning: true,
                aiNutritionAnalysis: true,
                exportData: true,
                mealReminders: true,
                progressAnalytics: true,
                prioritySupport: true,
                shoppingListGeneration: true,
                restaurantGuidance: true,
                maxPhotoUploadsPerDay: 10
            };
        default:
            return getDefaultFeatures();
    }
}
