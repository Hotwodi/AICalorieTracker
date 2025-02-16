import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, setDoc, doc, query, where } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBMUrnAPcXVwvqwCQLzhv2VJzgKAFDWiko",
  authDomain: "ai-calorie-tracker-3cdc8.firebaseapp.com",
  databaseURL: "https://ai-calorie-tracker-3cdc8-default-rtdb.firebaseio.com",
  projectId: "ai-calorie-tracker-3cdc8",
  storageBucket: "ai-calorie-tracker-3cdc8.appspot.com",
  messagingSenderId: "118996352240",
  appId: "1:118996352240:web:7a2d7760d06930d7fe5635",
  measurementId: "G-ELQC2WPN0V"
};

// Initialize Firebase
initializeApp(firebaseConfig);

const db = getFirestore();

async function migrateUsageLimits() {
  try {
    // Fetch all users from the main users collection
    const usersSnapshot = await getDocs(collection(db, "users"));
    
    console.log(`Found ${usersSnapshot.docs.length} users to process`);

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;

      // Skip admin user
      if (userId === "urtqkhH0v8WSMVYLtPrxXjoCLXy1") {
        console.log("Skipping admin user");
        continue;
      }

      // Create or update usage limits for each user
      const usageLimitDoc = {
        userId: userId,
        count: 0,
        maxDaily: 8, // Default daily limit
        date: new Date(),
        lastReset: new Date()
      };

      // Set the document in the usage_limits collection
      await setDoc(doc(db, "usage_limits", userId), usageLimitDoc, { merge: true });
      
      console.log(`Created/Updated usage limit for user: ${userId}`);
    }

    console.log("Usage limits migration completed successfully.");
  } catch (error) {
    console.error("Error migrating usage limits:", error);
  }
}

migrateUsageLimits();
