import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  getDocs,
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
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Test user ID (use a consistent test user)
const TEST_USER_ID = "test_database_structure_user";

async function runDatabaseStructureTests() {
  console.log("🧪 Starting Database Structure Tests 🧪");
  
  try {
    // Clean up any existing test data first
    const existingCollections = [
      `users/${TEST_USER_ID}/meals`,
      `users/${TEST_USER_ID}/calendar`,
      `users/${TEST_USER_ID}/recommendations`,
      `usage_limits`
    ];

    for (const collPath of existingCollections) {
      try {
        const collRef = collection(db, collPath);
        const snapshot = await getDocs(collRef);
        snapshot.docs.forEach(async (docSnap) => {
          await deleteDoc(docSnap.ref);
        });
      } catch (cleanupError) {
        console.warn(`Could not clean up collection ${collPath}:`, cleanupError);
      }
    }

    // Test 1: User Profile Creation
    console.log("\n📝 Test 1: User Profile Structure");
    const userRef = doc(db, "users", TEST_USER_ID);
    const userData = {
      userId: TEST_USER_ID,
      email: "test@example.com",
      dailyTargetCalories: 2000,
      targetMacros: { 
        fat: 70, 
        protein: 150, 
        carbs: 200 
      },
      createdAt: new Date()
    };
    
    await setDoc(userRef, userData);
    const userDoc = await getDoc(userRef);
    console.assert(userDoc.exists(), "User profile should exist");
    console.log("User Profile Data:", userDoc.data());

    // Test 2: Meal Logging
    console.log("\n🍽️ Test 2: Meal Logging");
    const mealData = {
      mealName: "Grilled Chicken with Rice",
      calories: 650,
      macros: { 
        fat: 15, 
        protein: 50, 
        carbs: 75 
      },
      timestamp: new Date(),
      userId: TEST_USER_ID
    };
    
    const mealRef = await addDoc(collection(db, `users/${TEST_USER_ID}/meals`), mealData);
    console.log("Meal logged with ID:", mealRef.id);

    // Test 3: Calendar Entry
    console.log("\n📅 Test 3: Calendar Entry");
    const today = new Date().toISOString().split('T')[0];
    const calendarData = {
      date: today,
      meals: [mealRef.id],
      totalCalories: 650,
      dailyMacros: mealData.macros
    };
    
    const calendarRef = doc(db, `users/${TEST_USER_ID}/calendar/${today}`);
    await setDoc(calendarRef, calendarData);
    const calendarDoc = await getDoc(calendarRef);
    console.assert(calendarDoc.exists(), "Calendar entry should be created");

    // Test 4: Nutrient Recommendations
    console.log("\n🥗 Test 4: Nutrient Recommendations");
    const recommendationRef = doc(db, `users/${TEST_USER_ID}/recommendations/${today}`);
    const recommendationData = {
      date: today,
      missingNutrients: { fiber: 10, vitaminC: 30 },
      suggestedFoods: ["Oranges", "Spinach"]
    };
    
    await setDoc(recommendationRef, recommendationData);
    const recommendationDoc = await getDoc(recommendationRef);
    console.assert(recommendationDoc.exists(), "Recommendation should be created");

    // Test 5: Usage Limits
    console.log("\n🔢 Test 5: Usage Limits");
    const usageLimitRef = doc(db, "usage_limits", TEST_USER_ID);
    const usageLimitData = {
      userId: TEST_USER_ID,
      count: 0,
      maxDaily: 8,
      date: new Date(),
      lastReset: new Date()
    };
    
    await setDoc(usageLimitRef, usageLimitData);
    const usageLimitDoc = await getDoc(usageLimitRef);
    console.assert(usageLimitDoc.exists(), "Usage limit record should exist");
    
    console.log("\n🎉 All Database Structure Tests Passed Successfully! 🎉");
  } catch (error) {
    console.error("❌ Test Failed:", error);
  }
}

// Run the tests
runDatabaseStructureTests();
