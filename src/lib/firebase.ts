import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  AuthError,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  type User,
  type UserCredential
} from 'firebase/auth';
import { 
  getFirestore,
  doc, 
  setDoc,
  getDoc,
  connectFirestoreEmulator,
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  deleteDoc
} from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

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

    console.log('[Firebase] Checking user document:', {
      userId: user.uid,
      email: user.email,
      documentExists: userSnapshot.exists()
    });

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
        // Add explicit permissions
        permissions: {
          read: true,
          write: true
        }
      };

      try {
        await setDoc(userRef, userData, { merge: true });
        console.log('[Firebase] Created user document successfully', { userId: user.uid });
      } catch (setError) {
        console.error('[Firebase] Error creating user document:', {
          userId: user.uid,
          errorCode: setError.code,
          errorMessage: setError.message
        });
        throw setError;
      }
    }
  } catch (error) {
    console.error('[Firebase] Error in createUserDocument:', {
      userId: user.uid,
      errorCode: error.code,
      errorMessage: error.message
    });
    throw error;
  }
};

// Check for existing session
const checkSession = async (): Promise<User | null> => {
  return new Promise((resolve, reject) => {
    const unsubscribe = firebaseOnAuthStateChanged(
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

// Define the structure for a calendar entry
interface CalendarEntry {
  id?: string;
  userId: string;
  date: string;
  notes?: string;
  events?: string[];
  nutritionGoals?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  completed?: boolean;
}

// Add calendar-related Firebase functions
const addCalendarEntry = async (
  userId: string, 
  entry: Omit<CalendarEntry, 'id' | 'userId'>
): Promise<string> => {
  try {
    const calendarRef = collection(db, 'calendar');
    const docRef = await addDoc(calendarRef, {
      ...entry,
      userId
    });
    return docRef.id;
  } catch (error) {
    console.error('[Firebase] Error adding calendar entry:', error);
    throw new Error('Failed to add calendar entry');
  }
};

const getCalendarEntriesByUser = async (
  userId: string, 
  startDate?: string, 
  endDate?: string
): Promise<CalendarEntry[]> => {
  try {
    const calendarRef = collection(db, 'calendar');
    let q = query(calendarRef, where('userId', '==', userId));

    // Optional date filtering
    if (startDate && endDate) {
      q = query(
        q, 
        where('date', '>=', startDate),
        where('date', '<=', endDate)
      );
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CalendarEntry));
  } catch (error) {
    console.error('[Firebase] Error fetching calendar entries:', error);
    throw new Error('Failed to fetch calendar entries');
  }
};

const updateCalendarEntry = async (
  entryId: string, 
  updates: Partial<CalendarEntry>
): Promise<void> => {
  try {
    const entryRef = doc(db, 'calendar', entryId);
    await updateDoc(entryRef, updates);
  } catch (error) {
    console.error('[Firebase] Error updating calendar entry:', error);
    throw new Error('Failed to update calendar entry');
  }
};

const deleteCalendarEntry = async (entryId: string): Promise<void> => {
  try {
    const entryRef = doc(db, 'calendar', entryId);
    await deleteDoc(entryRef);
  } catch (error) {
    console.error('[Firebase] Error deleting calendar entry:', error);
    throw new Error('Failed to delete calendar entry');
  }
};

export {
  signIn,
  signUp,
  signOut,
  updateUserProfile,
  checkSession,
  firebaseOnAuthStateChanged as onAuthStateChanged,
  User,
  UserCredential,
  CalendarEntry,
  addCalendarEntry,
  getCalendarEntriesByUser,
  updateCalendarEntry,
  deleteCalendarEntry,
  sendPasswordReset,
  auth,
  db
};
