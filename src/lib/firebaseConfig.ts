// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Firebase configuration with environment variable fallback
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBMUrnAPcXVwvqwCQLzhv2VJzgKAFDWiko",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ai-calorie-tracker-3cdc8.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://ai-calorie-tracker-3cdc8-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ai-calorie-tracker-3cdc8",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ai-calorie-tracker-3cdc8.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "118996352240",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:118996352240:web:7a2d7760d06930d7fe5635",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-ELQC2WPN0V"
};

// Validate Firebase configuration
const validateConfig = (config: typeof firebaseConfig): typeof firebaseConfig => {
  const requiredKeys: (keyof typeof firebaseConfig)[] = [
    'apiKey', 'authDomain', 'projectId', 'storageBucket', 
    'messagingSenderId', 'appId'
  ];

  for (const key of requiredKeys) {
    if (!config[key]) {
      throw new Error(`Firebase configuration missing required key: ${key}`);
    }
  }

  return config;
};

// Initialize Firebase only in browser environment
let app;
let analytics;

try {
  const validatedConfig = validateConfig(firebaseConfig);
  app = initializeApp(validatedConfig);
  
  // Only initialize analytics if in browser and not in development
  if (typeof window !== 'undefined' && import.meta.env.PROD) {
    analytics = getAnalytics(app);
  }
  
  console.log('[Firebase] Initialized successfully');
} catch (error) {
  console.error('[Firebase] Initialization error:', error);
  throw error;
}

export { app, analytics };