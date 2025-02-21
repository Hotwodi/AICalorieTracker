import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signIn, 
  signUp, 
  signOut, 
  updateUserProfile,
  checkSession,
  onAuthStateChanged
} from '@/lib/firebase';
import { getAuth } from 'firebase/auth';
import { User } from 'firebase/auth';
import { initializeUserRecord } from '@/userInitialization';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  signup: (email: string, password: string, profile?: { name?: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (displayName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const auth = getAuth();

  useEffect(() => {
    console.log('[AuthContext] Setting up auth state listener');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        console.log('[AuthContext] Auth state changed:', {
          userPresent: !!firebaseUser,
          email: firebaseUser?.email,
          isLoading: true
        });

        if (firebaseUser) {
          // User is signed in
          setUser(firebaseUser);
          setIsAuthenticated(true);
          
          // Initialize user record
          await initializeUserRecord(firebaseUser);
          
          console.log('[AuthContext] User initialized successfully');
        } else {
          // No user is signed in
          console.log('[AuthContext] No user signed in');
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('[AuthContext] Error in auth state change:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        console.log('[AuthContext] Setting isLoading to false');
        setIsLoading(false);
      }
    }, (error) => {
      console.error('[AuthContext] Auth state listener error:', error);
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      console.log('[AuthContext] Cleaning up auth state listener');
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    console.log('[AuthContext] Setting up initial session check');

    // Check for existing session on mount
    const verifySession = async () => {
      try {
        setIsLoading(true);
        const existingUser = await checkSession();
        
        if (existingUser) {
          // User is already logged in
          setUser(existingUser);
          setIsAuthenticated(true);
          toast({
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

    // Run session checks
    verifySession();
  }, [toast]);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const userCredential = await signIn(email, password);
      
      if (userCredential.user) {
        await initializeUserRecord(userCredential.user);
        setUser(userCredential.user);
        setIsAuthenticated(true);
        toast.success('Login successful');
      }
    } catch (error: any) {
      setIsAuthenticated(false);
      toast.error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, profile?: { name?: string }) => {
    try {
      setIsLoading(true);
      const userCredential: UserCredential = await signUp(email, password, profile?.name);
      
      toast({
        title: "Sign Up Successful",
        description: `Account created for ${userCredential.user.email}`,
      });
    } catch (error) {
      console.error('[AuthContext] Signup error:', error);
      toast({
        title: "Sign Up Failed",
        description: error instanceof Error ? error.message : "Unable to create account",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await signOut(auth);
      
      // Reset user state
      setUser(null);
      setIsAuthenticated(false);
      
      // Optional: Clear any user-specific data or local storage
      localStorage.removeItem('userToken');
      
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out",
      });
    } catch (error) {
      console.error('[AuthContext] Logout error:', error);
      toast({
        title: "Sign Out Failed",
        description: error instanceof Error ? error.message : "Unable to sign out",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (displayName: string) => {
    try {
      setIsLoading(true);
      await updateUserProfile(displayName);
      
      toast({
        title: "Profile Updated",
        description: `Display name updated to ${displayName}`,
      });
    } catch (error) {
      console.error('[AuthContext] Profile update error:', error);
      toast({
        title: "Profile Update Failed",
        description: error instanceof Error ? error.message : "Unable to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout,
    updateProfile
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
