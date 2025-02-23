import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { 
  signOut as firebaseSignOut,
  signInWithEmailAndPassword as firebaseSignIn,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  type User,
  type UserCredential
} from 'firebase/auth';
import { 
  doc, 
  setDoc,
  getDoc
} from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

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

const handleFirebaseAuthError = (error: unknown, context: string = 'Unknown'): never => {
  logAuthError(error, context);
  if (error instanceof Error) {
    throw new Error(error.message);
  }
  throw new Error(`Unexpected authentication error in ${context}`);
};

const createUserDocument = async (user: User, additionalData?: { displayName?: string }) => {
  if (!user) return;
  const userRef = doc(db, 'users', user.uid);
  try {
    const userSnapshot = await getDoc(userRef);
    if (!userSnapshot.exists()) {
      const { email } = user;
      const { displayName } = additionalData || {};
      const createdAt = new Date();
      const userData = {
        displayName: displayName || user.displayName || 'User',
        email,
        createdAt,
        dailyMacroGoals: {
          calories: 2000,
          protein: 100,
          carbs: 250,
          fat: 70
        },
        permissions: {
          read: true,
          write: true
        }
      };
      await setDoc(userRef, userData, { merge: true });
    }
  } catch (error) {
    console.error('[Firebase] Error in createUserDocument:', error);
    throw error;
  }
};

const checkSession = async (): Promise<User | null> => {
  return new Promise((resolve, reject) => {
    const unsubscribe = firebaseOnAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    }, (error) => {
      unsubscribe();
      reject(error);
    });
  });
};

const signIn = async (email: string, password: string): Promise<UserCredential> => {
  try {
    return await firebaseSignIn(auth, email, password);
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

const signUp = async (email: string, password: string, displayName: string): Promise<UserCredential> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });
    await createUserDocument(userCredential.user, { displayName });
    return userCredential;
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
};

const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    return true;
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

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

// Export the signInWithEmailAndPassword function
export const signInWithEmailAndPassword = firebaseSignIn;

export {
  db,
  auth,
  signIn,
  signUp,
  signOut,
  updateUserProfile,
  checkSession,
  firebaseOnAuthStateChanged as onAuthStateChanged,
  User,
  UserCredential
};