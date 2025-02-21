import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

export { performUserMaintenance, validateUserOnCreate } from './userMaintenance';
export { performDataCleanup } from './dataCleanup';
export { generateNutrientRecommendations } from './nutrientRecommendations';
export {
  validateSubscriptionAccess,
  updateSubscription,
  cancelSubscription,
  checkExpiredSubscriptions
} from './subscriptionManagement';
export {
  checkExpiredTrials,
  setupNewUserTrial
} from './trialManagement';
export {
  migrateUserData,
  validateUserDataStructure
} from './databaseMigration';

// Main application endpoint
export const app = onRequest({
  memory: '256MiB',
  timeoutSeconds: 30,
}, async (req, res) => {
  // Redirect to the main application
  res.redirect('https://aicalorietracker.web.app');
});
