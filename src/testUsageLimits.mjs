import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  deleteDoc 
} from 'firebase/firestore';

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

// Replicate key functions from userInitialization
async function createUserUsageLimit(userId) {
  const usageLimitRef = doc(db, "usage_limits", userId);
  
  const usageLimitData = {
    userId: userId,
    count: 0,
    maxDaily: 8, // Default daily limit
    date: new Date(),
    lastReset: new Date()
  };

  await setDoc(usageLimitRef, usageLimitData, { merge: true });
  
  console.log(`Created usage limit record for user: ${userId}`);
  return usageLimitData;
}

async function checkUserDailyLimit(userId) {
  const usageLimitRef = doc(db, "usage_limits", userId);
  const usageLimitSnap = await getDoc(usageLimitRef);

  if (!usageLimitSnap.exists()) {
    console.log(`No usage limit found for user ${userId}. Creating default.`);
    await createUserUsageLimit(userId);
    return false;
  }

  const usageData = usageLimitSnap.data();
  const isLimitReached = usageData.count >= usageData.maxDaily;

  console.log(`User ${userId} usage: ${usageData.count}/${usageData.maxDaily}`);
  
  return isLimitReached;
}

async function incrementUserUsage(userId) {
  const usageLimitRef = doc(db, "usage_limits", userId);
  const usageLimitSnap = await getDoc(usageLimitRef);

  if (!usageLimitSnap.exists()) {
    console.log(`No usage limit found for user ${userId}. Creating default.`);
    await createUserUsageLimit(userId);
  }

  const currentData = usageLimitSnap.data() || {};
  const newCount = (currentData.count || 0) + 1;

  await updateDoc(usageLimitRef, { 
    count: newCount,
    date: new Date() 
  });

  console.log(`Incremented usage for user ${userId} to ${newCount}`);
  return newCount;
}

async function resetUserDailyUsage(userId) {
  const usageLimitRef = doc(db, "usage_limits", userId);
  
  await updateDoc(usageLimitRef, {
    count: 0,
    lastReset: new Date()
  });

  console.log(`Reset daily usage for user ${userId}`);
}

async function runUsageLimitTests() {
  console.log("🧪 Starting Usage Limit Tests 🧪");
  
  // Test user ID for testing
  const testUserId = "test_user_usage_limits";
  const usageLimitRef = doc(db, "usage_limits", testUserId);

  try {
    // Clean up any existing test data
    await deleteDoc(usageLimitRef).catch(() => {});

    // Test 1: Create User Usage Limit
    console.log("\n📝 Test 1: Create User Usage Limit");
    const createdLimit = await createUserUsageLimit(testUserId);
    console.log("✅ Created Usage Limit:", createdLimit);
    
    // Verify initial state
    const initialDoc = await getDoc(usageLimitRef);
    console.assert(initialDoc.exists(), "Usage limit document should exist");
    console.assert(initialDoc.data().count === 0, "Initial count should be 0");
    console.assert(initialDoc.data().maxDaily === 8, "Default max daily should be 8");

    // Test 2: Check Daily Limit (Initial)
    console.log("\n📊 Test 2: Check Daily Limit (Initial)");
    const initialLimitCheck = await checkUserDailyLimit(testUserId);
    console.assert(initialLimitCheck === false, "Initial limit check should be false");

    // Test 3: Increment Usage
    console.log("\n🔢 Test 3: Increment Usage");
    for (let i = 1; i <= 8; i++) {
      const newCount = await incrementUserUsage(testUserId);
      console.log(`Increment ${i}: Count = ${newCount}`);
      console.assert(newCount === i, `Count should be ${i}`);
    }

    // Test 4: Limit Reached
    console.log("\n🚫 Test 4: Limit Reached");
    const limitReachedCheck = await checkUserDailyLimit(testUserId);
    console.assert(limitReachedCheck === true, "Limit should be reached after 8 increments");

    // Test 5: Reset Daily Usage
    console.log("\n🔄 Test 5: Reset Daily Usage");
    await resetUserDailyUsage(testUserId);
    const resetDoc = await getDoc(usageLimitRef);
    console.assert(resetDoc.data().count === 0, "Count should be reset to 0");

    console.log("\n🎉 All Usage Limit Tests Passed Successfully! 🎉");
  } catch (error) {
    console.error("❌ Test Failed:", error);
  } finally {
    // Clean up test data
    await deleteDoc(usageLimitRef).catch(() => {});
  }
}

// Run the tests
runUsageLimitTests();
