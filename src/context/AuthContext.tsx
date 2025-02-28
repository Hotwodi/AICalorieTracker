import React, { createContext, useContext, useEffect, useState } from 'react'; 
import { 
  signIn, 
  signUp, 
  checkSession,
  auth,
  onAuthStateChanged as firebaseOnAuthStateChanged
} from '@/lib/firebase';
import { User as FirebaseUser } from 'firebase/auth';
import { initializeUserRecord } from '@/userInitialization';
import { toast } from 'sonner';
import { SubscriptionService } from '../services/subscription';
import { UserService, UserProfile } from '../services/user-service';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';

interface AuthContextType {
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  subscriptionStatus: any;
  refreshSubscriptionStatus: () => Promise<void>;
  getAuthErrorLog: () => any[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [authErrors, setAuthErrors] = useState<any[]>([]);
  const { toast: toastNotification } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  console.log('AuthProvider: Initial render', { 
    isAuthenticated, 
    isLoading, 
    currentPath: location.pathname 
  });

  useEffect(() => {
    console.log('Setting up auth state listener');
    
    const unsubscribe = firebaseOnAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', { 
        userPresent: !!firebaseUser, 
        email: firebaseUser?.email,
        currentPath: location.pathname
      });

      setIsLoading(true);
      try {
        if (firebaseUser) {
          const userProfile: UserProfile = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || ''
          };
          
          console.log('User authenticated:', userProfile);
          
          setUser(userProfile);
          setIsAuthenticated(true);
          await initializeUserRecord(firebaseUser);

          // Redirect logic
          if (location.pathname === '/') {
            console.log('Redirecting to /index');
            navigate('/index');
          }
        } else {
          console.log('No user authenticated, resetting state');
          setUser(null);
          setIsAuthenticated(false);
          
          // Redirect to login if on a protected route
          if (location.pathname !== '/') {
            console.log('Redirecting to login page');
            navigate('/');
          }
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setUser(null);
        setIsAuthenticated(false);
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate, location.pathname]);

  // Additional session verification on initial load
  useEffect(() => {
    const verifyInitialSession = async () => {
      console.log('Verifying initial session');
      try {
        const existingUser = await checkSession();
        
        console.log('Existing user from session check:', existingUser ? existingUser.email : 'No user');
        
        if (existingUser) {
          const userProfile: UserProfile = {
            id: existingUser.uid,
            email: existingUser.email || '',
            name: existingUser.displayName || existingUser.email?.split('@')[0] || ''
          };
          
          setUser(userProfile);
          setIsAuthenticated(true);
          
          if (location.pathname === '/') {
            console.log('Redirecting to /index after session verification');
            navigate('/index');
          }
        } else {
          console.log('No user found in session verification');
          setUser(null);
          setIsAuthenticated(false);
          navigate('/');
        }
      } catch (error) {
        console.error('Initial session verification error:', error);
        setUser(null);
        setIsAuthenticated(false);
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    verifyInitialSession();
  }, [navigate, location.pathname]);

  const login = async (email: string, password: string) => {
    console.log('Login attempt:', email);
    setIsLoading(true);
    try {
      const userCredential = await signIn(email, password);
      
      const userProfile: UserProfile = {
        id: userCredential.user.uid,
        email: userCredential.user.email || '',
        name: userCredential.user.displayName || email.split('@')[0] || ''
      };
      
      console.log('Login successful:', userProfile);
      
      setUser(userProfile);
      setIsAuthenticated(true);
      
      await SubscriptionService.initializeBasicSubscription(userProfile.id);
      await refreshSubscriptionStatus();
      
      toast.success('Logged in successfully');
      navigate('/index');
    } catch (error) {
      console.error('Login error:', error);
      setUser(null);
      setIsAuthenticated(false);
      
      toastNotification({
        title: 'Login Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    console.log('Signup attempt:', email);
    setIsLoading(true);
    try {
      const userCredential = await signUp(email, password, name);
      
      const userProfile: UserProfile = {
        id: userCredential.user.uid,
        email: userCredential.user.email || '',
        name: name
      };
      
      console.log('Signup successful:', userProfile);
      
      setUser(userProfile);
      setIsAuthenticated(true);
      
      await SubscriptionService.initializeBasicSubscription(userProfile.id);
      await refreshSubscriptionStatus();
      
      toast.success('Account created successfully');
      navigate('/index');
    } catch (error) {
      console.error('Signup error:', error);
      setUser(null);
      setIsAuthenticated(false);
      
      toastNotification({
        title: 'Signup Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await UserService.logout();
      setUser(null);
      setIsAuthenticated(false);
      setSubscriptionStatus(null);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toastNotification({
        title: 'Logout Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive'
      });
    }
  };

  const refreshSubscriptionStatus = async () => {
    if (user) {
      try {
        const status = await SubscriptionService.getSubscriptionStatus(user.id);
        setSubscriptionStatus(status);
      } catch (error) {
        console.error('Subscription status refresh error:', error);
      }
    } else {
      setSubscriptionStatus(null);
    }
  };

  const getAuthErrorLog = () => authErrors;

  const value = {
    user,
    login,
    signup,
    logout,
    isAuthenticated,
    isLoading,
    subscriptionStatus,
    refreshSubscriptionStatus,
    getAuthErrorLog
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
