import React, { createContext, useContext, useEffect, useState } from 'react'; 
import { 
  signIn, 
  signUp, 
  checkSession,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  auth
} from '@/lib/firebase';
import { User as FirebaseUser } from 'firebase/auth';
import { initializeUserRecord } from '@/userInitialization';
import { toast } from 'sonner';
import { SubscriptionService } from '../services/subscription';
import { UserService, UserProfile } from '../services/user-service';
import { SubscriptionTier } from '../types/subscription';
import { useToast } from '@/components/ui/use-toast';

interface AuthContextType {
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  subscriptionStatus: any;
  refreshSubscriptionStatus: () => Promise<void>;
  upgradeToPremium: () => Promise<void>;
  getAuthErrorLog: () => any[];
}

interface AuthError {
  type: 'signup' | 'login' | 'logout' | 'unknown';
  message: string;
  details?: any;
  timestamp: number;
}

interface User {
  id: string;
  email: string;
  name: string;
}

interface SubscriptionStatus {
  isValid: boolean;
  remainingUploads: number;
  isPremium: boolean;
  trialDaysLeft?: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [authErrors, setAuthErrors] = useState<any[]>([]);
  const { toast: toastNotification } = useToast();

  useEffect(() => {
    console.log('[AuthContext] Setting up auth state listener');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        console.log('[AuthContext] Auth state changed:', {
          userPresent: !!firebaseUser,
          email: firebaseUser?.email
        });

        if (firebaseUser) {
          // Convert Firebase user to UserProfile format
          const userProfile: UserProfile = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || ''
          };
          
          setUser(userProfile);
          setIsAuthenticated(true);
          
          await initializeUserRecord(firebaseUser);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('[AuthContext] Error in auth state change:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    console.log('[AuthContext] Setting up initial session check');

    const verifySession = async () => {
      try {
        setIsLoading(true);
        const existingUser = await checkSession();
        
        if (existingUser) {
          // Convert Firebase user to UserProfile format
          const userProfile: UserProfile = {
            id: existingUser.uid,
            email: existingUser.email || '',
            name: existingUser.displayName || existingUser.email?.split('@')[0] || ''
          };
          
          setUser(userProfile);
          setIsAuthenticated(true);
          toastNotification({
            title: "Welcome Back!",
            description: `Signed in as ${existingUser.email}`,
          });
        }
      } catch (error) {
        console.error('[AuthContext] Session verification error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, []);

  const logAuthError = (error: Partial<any>) => {
    const newError: any = {
      type: error.type || 'unknown',
      message: error.message || 'Unknown authentication error',
      details: error.details,
      timestamp: Date.now()
    };

    // Add to error log
    setAuthErrors(prev => [...prev, newError]);

    // Display toast notification
    toastNotification({
      title: `Authentication ${newError.type} Error`,
      description: newError.message,
      variant: 'destructive'
    });

    // Optional: Log to console for debugging
    console.error('Authentication Error:', newError);
  };

  const refreshSubscriptionStatus = async () => {
    if (user) {
      try {
        const status = await SubscriptionService.getSubscriptionStatus(user.id);
        setSubscriptionStatus(status);
      } catch (error) {
        logAuthError({
          type: 'unknown',
          message: 'Failed to refresh subscription status',
          details: error
        });
      }
    } else {
      setSubscriptionStatus(null);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Remove the email check and directly try to sign in
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Convert Firebase user to UserProfile format
      const userProfile: UserProfile = {
        id: userCredential.user.uid,
        email: userCredential.user.email || '',
        name: userCredential.user.displayName || email.split('@')[0] || ''
      };
      
      // Update user state
      setUser(userProfile);
      setIsAuthenticated(true);
      
      // Initialize subscription if needed
      await SubscriptionService.initializeBasicSubscription(userProfile.id);
      await refreshSubscriptionStatus();
      
      // Show success message
      toast.success('Logged in successfully');
      
      // Redirect to home page after login
      window.location.href = '/';
    } catch (error) {
      logAuthError({
        type: 'login',
        message: error instanceof Error ? error.message : 'Login failed',
        details: error
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      // Check if email already exists
      const emailExists = await UserService.isEmailRegistered(email);
      if (emailExists) {
        throw new Error('Email already registered');
      }

      const userData: User = {
        id: `user-${Date.now()}`,
        email,
        name
      };

      // Create user in Firestore
      const userProfile = await UserService.createOrUpdateUser(userData);

      // Update login status
      await UserService.updateUserLoginStatus(userProfile.id, true);

      // Store user in localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userProfile);
      
      // Initialize basic subscription for new users
      await SubscriptionService.initializeBasicSubscription(userProfile.id);
      await refreshSubscriptionStatus();
      
      // Redirect to home page after signup
      window.location.href = '/';
    } catch (error) {
      logAuthError({
        type: 'signup',
        message: error instanceof Error ? error.message : 'Signup failed',
        details: error
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      if (user) {
        // Update user status before logging out
        await UserService.updateUserLoginStatus(user.id, false);
      }
      
      // Call the UserService logout method which handles Firebase signOut
      await UserService.logout();
      
      // Clear all states
      setUser(null);
      setIsAuthenticated(false);
      setSubscriptionStatus(null);
      
      // Show success message using toast from sonner
      toast.success('Logged out successfully');
      
      // Redirect to login page
      window.location.href = '/login';
    } catch (error) {
      logAuthError({
        type: 'logout',
        message: error instanceof Error ? error.message : 'Logout failed',
        details: error
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    login,
    signup,
    logout,
    isAuthenticated,
    isLoading,
    subscriptionStatus,
    refreshSubscriptionStatus,
    upgradeToPremium: async () => {
      // Implement upgrade logic here
      throw new Error('Not implemented');
    },
    getAuthErrorLog: () => authErrors
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
