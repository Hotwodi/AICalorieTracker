import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
  readFileSync('./serviceAccountKey.json', 'utf8')
);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function testSubscription(userId, durationDays = 20) {
  try {
    const batch = db.batch();
    
    // Calculate end date
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationDays);
    
    // Update user document
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      console.error('User not found:', userId);
      return;
    }

    batch.update(userRef, {
      subscription: 'premium',
      subscriptionEndDate: endDate,
      maxPhotoUploadsPerDay: 8,
      updatedAt: new Date()
    });

    // Update upload rules
    const uploadRulesRef = userRef.collection('upload_rules').doc('daily');
    batch.update(uploadRulesRef, {
      maxDaily: 8,
      lastUpdated: new Date()
    });

    // Add notification
    const notificationRef = userRef.collection('notifications').doc();
    batch.set(notificationRef, {
      type: 'subscription_updated',
      title: 'Premium Access Granted',
      message: `You now have premium access until ${endDate.toLocaleDateString()}!`,
      createdAt: new Date(),
      read: false
    });

    await batch.commit();
    console.log(`Successfully upgraded user ${userId} to premium until ${endDate.toLocaleDateString()}`);

    // Print user's current status
    const updatedUser = await userRef.get();
    console.log('\nUser Status:');
    console.log('------------');
    console.log('Email:', updatedUser.data().email);
    console.log('Subscription:', updatedUser.data().subscription);
    console.log('Max Daily Uploads:', updatedUser.data().maxPhotoUploadsPerDay);
    console.log('Subscription End Date:', endDate.toLocaleDateString());

  } catch (error) {
    console.error('Error upgrading user:', error);
  }
}

// Check command line arguments
const userId = process.argv[2];
const days = parseInt(process.argv[3]) || 20;

if (!userId) {
  console.error('Please provide a user ID as an argument:');
  console.error('npm run test-subscription <userId> [days]');
  process.exit(1);
}

testSubscription(userId, days)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
