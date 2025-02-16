import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  AuthError,
  onAuthStateChanged,
  User,
  UserCredential
} from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache,
  doc, 
  setDoc,
  getDoc,
  connectFirestoreEmulator
} from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firestore with persistent local cache
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    // Optional: Configure cache size and other settings
    sizeBytes: 100 * 1024 * 1024 // 100MB cache
  })
});

// Verbose error logging
const logAuthError = (error: unknown, context: string) => {
  console.error(`[Firebase Auth Error - ${context}]`, error);
  if (error instanceof Error) {
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
  }
};

// Custom error handler for Firebase authentication
const handleFirebaseAuthError = (error: unknown, context: string = 'Unknown'): never => {
  logAuthError(error, context);
  
  if (error instanceof Error) {
    switch (error.message) {
      case 'Firebase: Error (auth/email-already-in-use).':
        throw new Error('Email is already registered. Please sign in or use a different email.');
      case 'Firebase: Error (auth/invalid-email).':
        throw new Error('Invalid email address. Please check and try again.');
      case 'Firebase: Error (auth/weak-password).':
        throw new Error('Password is too weak. Please choose a stronger password.');
      case 'Firebase: Error (auth/invalid-credential).':
        throw new Error('Invalid credentials. Please check your email and password.');
      default:
        throw new Error(`Authentication failed: ${error.message}`);
    }
  }
  
  throw new Error(`Unexpected authentication error in ${context}`);
};

// Helper function to create user document
const createUserDocument = async (user: User, additionalData?: { displayName?: string }) => {
  if (!user) return;

  const userRef = doc(db, 'users', user.uid);
  
  try {
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      const { email } = user;
      const { displayName } = additionalData || {};
      const createdAt = new Date();

      await setDoc(userRef, {
        displayName: displayName || user.displayName || 'User',
        email,
        createdAt,
        dailyMacroGoals: {
          calories: 2000,
          protein: 100,
          carbs: 250,
          fat: 70
        }
      });
    }
  } catch (error) {
    handleFirebaseAuthError(error, 'Create User Document');
  }
};

// Check for existing session
const checkSession = async (): Promise<User | null> => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth, 
      (user) => {
        unsubscribe();
        resolve(user);
      },
      (error) => {
        unsubscribe();
        reject(error);
      }
    );
  });
};

// Sign In method
const signIn = async (email: string, password: string): Promise<UserCredential> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error) {
    handleFirebaseAuthError(error, 'Sign In');
    // This line will never be reached due to the error handling above
    throw error;
  }
};

// Sign Up method
const signUp = async (email: string, password: string, displayName?: string): Promise<UserCredential> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update profile with display name if provided
    if (displayName) {
      await updateProfile(user, { displayName });
    }

    // Create user document in Firestore
    await createUserDocument(user, { displayName });

    return userCredential;
  } catch (error) {
    handleFirebaseAuthError(error, 'Sign Up');
    // This line will never be reached due to the error handling above
    throw error;
  }
};

// Sign Out method
const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    handleFirebaseAuthError(error, 'Sign Out');
  }
};

// Update user profile
const updateUserProfile = async (displayName: string) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('No user is currently signed in');
  }

  try {
    await updateProfile(currentUser, { displayName });
    await createUserDocument(currentUser, { displayName });
  } catch (error) {
    handleFirebaseAuthError(error, 'Update Profile');
  }
};

// Send password reset email
const sendPasswordReset = async (email: string) => {
  try {
    // Implement password reset logic here
  } catch (error) {
    handleFirebaseAuthError(error, 'Password Reset');
  }
};

export {
  signIn,
  signUp,
  signOut,
  updateUserProfile,
  sendPasswordReset,
  checkSession,
  createUserDocument
};
