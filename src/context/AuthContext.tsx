import React, { createContext, useState, useContext, useEffect } from 'react';
import { SubscriptionService } from '../services/subscription';
import { SubscriptionTier } from '../types/subscription';

// User interface
export interface User {
  id: string;
  email: string;
  name: string;
}

// Subscription status interface
interface SubscriptionStatus {
  isValid: boolean;
  remainingUploads: number;
  isPremium: boolean;
  trialDaysLeft?: number;
}

// Authentication context interface
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  subscriptionStatus: SubscriptionStatus | null;
  refreshSubscriptionStatus: () => Promise<void>;
  upgradeToPremium: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);

  const refreshSubscriptionStatus = async () => {
    if (user) {
      const status = await SubscriptionService.getSubscriptionStatus(user.id);
      setSubscriptionStatus(status);
    } else {
      setSubscriptionStatus(null);
    }
  };

  // Check for existing authentication and subscription on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      refreshSubscriptionStatus();
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Simulated user data
      const userData: User = {
        id: `user-${Date.now()}`,
        email,
        name: email.split('@')[0]
      };

      // Store user in localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      // Initialize basic subscription for new users
      await SubscriptionService.initializeBasicSubscription(userData.id);
      await refreshSubscriptionStatus();
      
      // Redirect to home page after login
      window.location.href = '/';
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const userData: User = {
        id: `user-${Date.now()}`,
        email,
        name
      };

      // Store user in localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      // Initialize basic subscription for new users
      await SubscriptionService.initializeBasicSubscription(userData.id);
      await refreshSubscriptionStatus();
      
      // Redirect to home page after signup
      window.location.href = '/';
    } catch (error) {
      console.error('Signup failed', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Remove user from localStorage
    localStorage.removeItem('user');
    setUser(null);
    setSubscriptionStatus(null);
  };

  const upgradeToPremium = async () => {
    if (!user) return;
    await SubscriptionService.upgradeToPremium(user.id);
    await refreshSubscriptionStatus();
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        signup, 
        logout, 
        isAuthenticated: !!user,
        isLoading,
        subscriptionStatus,
        refreshSubscriptionStatus,
        upgradeToPremium
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the Auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
