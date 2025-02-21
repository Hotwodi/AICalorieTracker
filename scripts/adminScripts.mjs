import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import readline from 'readline';

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
  readFileSync('./serviceAccountKey.json', 'utf8')
);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// Create interface for CLI
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper to ask questions
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function listUsers() {
  const users = await db.collection('users').get();
  console.log('\nUser List:');
  console.log('-----------');
  users.forEach(user => {
    const data = user.data();
    console.log(`ID: ${user.id}`);
    console.log(`Email: ${data.email}`);
    console.log(`Subscription: ${data.subscription}`);
    console.log(`Last Active: ${data.lastActive?.toDate().toLocaleDateString()}`);
    console.log('-----------');
  });
}

async function forceLogoutAllUsers() {
  const batch = db.batch();
  const users = await db.collection('users').get();
  
  users.forEach(user => {
    batch.update(user.ref, {
      forceLogout: true,
      lastForceLogout: new Date()
    });
  });

  await batch.commit();
  console.log(`Forced logout for ${users.size} users`);
}

async function revokeAllPremiumSubscriptions() {
  const batch = db.batch();
  const users = await db.collection('users')
    .where('subscription', '==', 'premium')
    .get();

  for (const user of users.docs) {
    // Update user document
    batch.update(user.ref, {
      subscription: 'free',
      subscriptionEndDate: null,
      maxPhotoUploadsPerDay: 3
    });

    // Update upload rules
    const uploadRulesRef = user.ref.collection('upload_rules').doc('daily');
    batch.update(uploadRulesRef, {
      maxDaily: 3
    });
  }

  await batch.commit();
  console.log(`Revoked premium access for ${users.size} users`);
}

async function resetUserUploadCounts() {
  const batch = db.batch();
  const users = await db.collection('users').get();

  for (const user of users.docs) {
    const uploadRulesRef = user.ref.collection('upload_rules').doc('daily');
    batch.update(uploadRulesRef, {
      count: 0,
      lastReset: new Date()
    });
  }

  await batch.commit();
  console.log(`Reset upload counts for ${users.size} users`);
}

async function makeUserAdmin(userId) {
  const userRef = db.collection('users').doc(userId);
  const user = await userRef.get();

  if (!user.exists) {
    console.log('User not found');
    return;
  }

  await userRef.update({
    role: 'admin'
  });

  console.log(`Successfully made user ${userId} an admin`);
}

async function showMenu() {
  console.log('\nAdmin Scripts Menu:');
  console.log('1. List All Users');
  console.log('2. Force Logout All Users');
  console.log('3. Revoke All Premium Subscriptions');
  console.log('4. Reset All User Upload Counts');
  console.log('5. Make User Admin');
  console.log('6. Exit');

  const choice = await question('\nEnter your choice (1-6): ');

  switch (choice) {
    case '1':
      await listUsers();
      break;
    case '2':
      await forceLogoutAllUsers();
      break;
    case '3':
      await revokeAllPremiumSubscriptions();
      break;
    case '4':
      await resetUserUploadCounts();
      break;
    case '5':
      const userId = await question('Enter user ID: ');
      await makeUserAdmin(userId);
      break;
    case '6':
      rl.close();
      process.exit(0);
      break;
    default:
      console.log('Invalid choice');
  }

  await showMenu();
}

// Start the menu
showMenu().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
