import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc 
} from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBMUrnAPcXVwvqwCQLzhv2VJzgKAFDWiko",
  authDomain: "ai-calorie-tracker-3cdc8.firebaseapp.com",
  projectId: "ai-calorie-tracker-3cdc8",
  storageBucket: "ai-calorie-tracker-3cdc8.appspot.com",
  messagingSenderId: "118996352240",
  appId: "1:118996352240:web:7a2d7760d06930d7fe5635"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Predefined test user emails
const TEST_EMAILS = [
  "Imim72383@gmail.com",
  "abidkhandikhan57@gmail.com",
  "abubakrmalana500@gmail.com",
  "aishashafeeq55@gmail.com",
  "aliyanfaizan2526@gmail.com",
  "anellabano@gmail.com",
  "anojaha055@gmail.com",
  "arshadbaloch1386@gmail.com",
  "ashoail3505@gmail.com",
  "au798486@gmail.com",
  "azizkham469@gmail.com",
  "balochsubhan922@gmail.com",
  "basswakat@gmail.com",
  "farazmalana123@gmail.com",
  "fozias496@gmail.com",
  "haseeeb647@gmail.com",
  "iqraghafar90@gmail.com",
  "majeedfaisal771@gmail.com",
  "ms5353232@gmail.com",
  "muhamadshamoon104@gmail.com",
  "mujjabfatima5121472@gmail.com",
  "nadeemkundi360@gmail.com",
  "nasiakhan150@gmail.com",
  "oozykhan7@gmail.com",
  "parova4444@gmail.com",
  "qruk411@gmail.com",
  "salosolar965@gmail.com",
  "sanyasir666@gmail.com",
  "uk203272@gmail.com",
  "usmanbaloch3215@gmail.com",
  "yasirnawaz78689@gmail.com",
  "z46456706@gmail.com",
  "zoya43035@gmail.com",
  "zubikhan2536@gmail.com",
  "zurainabbas82@gmail.com"
];

// Default configuration
const DEFAULT_PASSWORD = "TestUser2025!";
const DEFAULT_DAILY_CALORIES = 2000;
const DEFAULT_MACROS = {
  fat: 70,
  protein: 150,
  carbs: 200
};

async function createTestUser(email) {
  try {
    // Create user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, DEFAULT_PASSWORD);
    const user = userCredential.user;

    // Create comprehensive user profile in Firestore
    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, {
      userId: user.uid,
      email: email,
      subscription: "free",  // Default to free tier
      dailyTargetCalories: DEFAULT_DAILY_CALORIES,
      targetMacros: DEFAULT_MACROS,
      createdAt: new Date(),
      isTestUser: true  // Flag to identify test users
    });

    console.log(`✅ Created test user: ${email}`);
    return { email, password: DEFAULT_PASSWORD, uid: user.uid };
  } catch (error) {
    console.error(`❌ Failed to create test user ${email}:`, error);
    return null;
  }
}

async function bulkCreateTestUsers() {
  console.log(`🚀 Generating ${TEST_EMAILS.length} Test Users`);
  
  const testUsers = [];
  for (const email of TEST_EMAILS) {
    const user = await createTestUser(email);
    if (user) testUsers.push(user);
  }

  // Save test users to a JSON file for reference
  import('fs').then(fs => {
    fs.writeFileSync(
      './test_users.json', 
      JSON.stringify(testUsers, null, 2)
    );
    console.log('📄 Test users saved to test_users.json');
  });

  return testUsers;
}

// Run the script
bulkCreateTestUsers();
