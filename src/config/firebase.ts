import { initializeApp, FirebaseOptions } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// Firebase configuration
const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyDIitwPjgLjAyD7Ah3yRHNLagfGjz61Qkg",
  authDomain: "calorie-tracker-ai.firebaseapp.com",
  projectId: "calorie-tracker-ai",
  storageBucket: "calorie-tracker-ai.appspot.com",
  messagingSenderId: "1087654321",
  appId: "1:1087654321:web:abcdef123456",
  measurementId: "G-ABCDEFGHIJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Authentication
export const auth = getAuth(app);

// Development environment emulator setup
if (import.meta.env.DEV) {
  // Uncomment and set appropriate ports if using local emulators
  // connectFirestoreEmulator(db, 'localhost', 8080);
  // connectAuthEmulator(auth, 'http://localhost:9099');
}

export { app };
