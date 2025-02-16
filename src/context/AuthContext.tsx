import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserCredential } from 'firebase/auth';
import { 
  auth, 
  signIn, 
  signUp, 
  signOut, 
  updateUserProfile,
  checkSession 
} from '@/lib/firebase';
import { useToast } from '@/components/ui/use-toast';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, profile?: { name?: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (displayName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    console.log('[AuthContext] Setting up auth state listener');

    // Check for existing session on mount
    const verifySession = async () => {
      try {
        setIsLoading(true);
        const existingUser = await checkSession();
        
        if (existingUser) {
          // User is already logged in
          setUser(existingUser);
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

    // Set up auth state listener
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      console.log('[AuthContext] Auth state changed:', {
        userPresent: !!firebaseUser,
        email: firebaseUser?.email
      });
      setUser(firebaseUser);
      setIsLoading(false);
    });

    // Run session checks
    verifySession();

    return () => {
      console.log('[AuthContext] Cleaning up auth state listener');
      unsubscribe();
    };
  }, [toast]);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const userCredential: UserCredential = await signIn(email, password);
      
      toast({
        title: "Sign In Successful",
        description: `Signed in as ${userCredential.user.email}`,
      });
    } catch (error) {
      console.error('[AuthContext] Login error:', error);
      toast({
        title: "Sign In Failed",
        description: error instanceof Error ? error.message : "Unable to sign in",
        variant: "destructive",
      });
      throw error;
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
      await signOut();
      
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
    isAuthenticated: !!user,
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
