import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

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

async function updateExistingUsers() {
  try {
    const usersRef = collection(db, "users");
    const usersSnapshot = await getDocs(usersRef);

    const updatePromises = usersSnapshot.docs.map(async (userDoc) => {
      const userData = userDoc.data();
      const updateData = {};

      // Ensure required fields exist
      if (userData.userId === "urtqkhH0v8WSMVYLtPrxXjoCLXy1") {
        console.log("Skipping admin user:", userData.userId);
        return;
      }

      if (userData.count === undefined) updateData.count = 0;
      if (userData.maxDaily === undefined) updateData.maxDaily = 8; // Default daily limit
      if (!userData.date) updateData.date = new Date();
      if (!userData.lastReset) updateData.lastReset = new Date();

      if (Object.keys(updateData).length > 0) {
        await updateDoc(doc(db, "users", userDoc.id), updateData);
        console.log(`Updated user: ${userDoc.id}`);
      }
    });

    // Wait for all updates to complete
    await Promise.all(updatePromises);

    console.log("All existing users are now updated.");
  } catch (error) {
    console.error("Error updating existing users:", error);
  }
}

updateExistingUsers();
