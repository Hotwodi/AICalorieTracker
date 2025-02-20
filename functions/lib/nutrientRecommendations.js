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
exports.generateNutrientRecommendations = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
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
exports.generateNutrientRecommendations = functions.pubsub
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
            const missingNutrients = {};
            const targetMacros = userData.targetMacros;
            const dailyMacros = (dailyData === null || dailyData === void 0 ? void 0 : dailyData.dailyMacros) || {};
            // Compare intake vs. target
            Object.keys(targetMacros).forEach((macro) => {
                if ((dailyMacros[macro] || 0) < targetMacros[macro]) {
                    missingNutrients[macro] = targetMacros[macro] - (dailyMacros[macro] || 0);
                }
            });
            // Generate food suggestions
            const suggestedFoods = [];
            Object.keys(missingNutrients).forEach((macro) => {
                suggestedFoods.push(foodSuggestions[macro][Math.floor(Math.random() * 3)]);
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
    }
    catch (error) {
        logger.error('Error generating nutrient recommendations', error);
        return null;
    }
});
