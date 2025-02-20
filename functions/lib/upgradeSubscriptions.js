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
exports.verifyUpgrade = exports.upgradePremiumToProfessional = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
const logger = functions.logger;
/**
 * Upgrades all premium subscriptions to professional tier
 */
exports.upgradePremiumToProfessional = functions.https.onCall(async (data, context) => {
    // Verify admin access
    if (!context.auth || context.auth.token.email !== 'hotwodi4@gmail.com') {
        throw new functions.https.HttpsError('permission-denied', 'Only admin can perform this operation');
    }
    try {
        // Query all users with premium subscription
        const premiumUsersQuery = db.collection('users').where('subscription.tier', '==', 'premium');
        const snapshot = await premiumUsersQuery.get();
        const result = {
            usersUpdated: 0,
            errors: []
        };
        // Batch updates for better performance
        const batches = [];
        let currentBatch = db.batch();
        let operationCount = 0;
        for (const doc of snapshot.docs) {
            try {
                const userRef = doc.ref;
                currentBatch.update(userRef, {
                    'subscription.tier': 'professional',
                    'subscription.features': {
                        maxMealPlans: 10,
                        customMealPlanning: true,
                        aiNutritionAnalysis: true,
                        exportData: true,
                        mealReminders: true,
                        progressAnalytics: true,
                        prioritySupport: true,
                        shoppingListGeneration: true,
                        restaurantGuidance: true,
                        maxPhotoUploadsPerDay: -1
                    },
                    'subscription.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
                    'subscription.upgradedFromPremium': true
                });
                operationCount++;
                result.usersUpdated++;
                // Firebase has a limit of 500 operations per batch
                if (operationCount === 499) {
                    batches.push(currentBatch);
                    currentBatch = db.batch();
                    operationCount = 0;
                }
            }
            catch (error) {
                result.errors.push(`Error updating user ${doc.id}: ${error.message}`);
                logger.error('Error in upgrade operation:', error);
            }
        }
        // Push the last batch if it has any operations
        if (operationCount > 0) {
            batches.push(currentBatch);
        }
        // Commit all batches
        await Promise.all(batches.map(batch => batch.commit()));
        logger.info('Subscription upgrade completed', result);
        return result;
    }
    catch (error) {
        logger.error('Error in upgradePremiumToProfessional:', error);
        throw new functions.https.HttpsError('internal', 'Error upgrading subscriptions');
    }
});
/**
 * Verifies the upgrade was successful
 */
exports.verifyUpgrade = functions.https.onCall(async (data, context) => {
    // Verify admin access
    if (!context.auth || context.auth.token.email !== 'hotwodi4@gmail.com') {
        throw new functions.https.HttpsError('permission-denied', 'Only admin can perform this operation');
    }
    try {
        // Get counts before and after upgrade
        const [premiumCount, professionalCount, upgradedFromPremiumCount] = await Promise.all([
            db.collection('users')
                .where('subscription.tier', '==', 'premium')
                .count()
                .get()
                .then(snap => snap.data().count),
            db.collection('users')
                .where('subscription.tier', '==', 'professional')
                .count()
                .get()
                .then(snap => snap.data().count),
            db.collection('users')
                .where('subscription.upgradedFromPremium', '==', true)
                .count()
                .get()
                .then(snap => snap.data().count)
        ]);
        return {
            remainingPremiumUsers: premiumCount,
            totalProfessionalUsers: professionalCount,
            usersUpgradedFromPremium: upgradedFromPremiumCount,
            verificationTime: admin.firestore.Timestamp.now()
        };
    }
    catch (error) {
        logger.error('Error in verifyUpgrade:', error);
        throw new functions.https.HttpsError('internal', 'Error verifying upgrade');
    }
});
