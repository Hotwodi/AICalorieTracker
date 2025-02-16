import { initializeApp } from 'firebase/app.js';
import { firebaseConfig } from './lib/firebaseConfig.js';
import { updateExistingUsers } from './userInitialization.js';

// Initialize Firebase
initializeApp(firebaseConfig);

// Run the update immediately
async function runUpdate() {
  try {
    console.log('Starting user update process...');
    await updateExistingUsers();
    console.log('User update process completed.');
    process.exit(0);
  } catch (error) {
    console.error('Error during user update:', error);
    process.exit(1);
  }
}

await runUpdate();
