import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { 
  initializeUserRecord, 
  UserProfile, 
  checkUserPermission,
  logUserAction 
} from '@/userInitialization';
import { toast } from 'sonner';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  hasFeatureAccess: (feature: keyof NonNullable<UserProfile['permissions']['features']>) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Initialize or update user record
          const profile = await initializeUserRecord(user);
          setCurrentUser(user);
          setUserProfile(profile);
          
          // Log user login action
          await logUserAction(user.uid, 'user_login', { 
            email: user.email, 
            timestamp: new Date().toISOString() 
          });
        } catch (error) {
          console.error('Failed to initialize user record', error);
          toast.error('Authentication error', {
            description: 'Unable to load user profile'
          });
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      toast.success('Successfully signed in');
    } catch (error) {
      console.error('Sign in error', error);
      toast.error('Sign in failed', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      toast.success('Account created successfully');
    } catch (error) {
      console.error('Sign up error', error);
      toast.error('Sign up failed', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      if (currentUser) {
        await logUserAction(currentUser.uid, 'user_logout');
      }
      await firebaseSignOut(auth);
      toast.success('Successfully signed out');
    } catch (error) {
      console.error('Sign out error', error);
      toast.error('Sign out failed');
    }
  };

  const hasFeatureAccess = (feature: keyof NonNullable<UserProfile['permissions']['features']>): boolean => {
    return userProfile ? checkUserPermission(userProfile, feature) : false;
  };

  const value = {
    currentUser,
    userProfile,
    signIn,
    signUp,
    signOut,
    hasFeatureAccess
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
