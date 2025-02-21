import React, { createContext, useState, useContext, useEffect } from 'react';
import { MealSuggestionService, MealSuggestion } from '@/services/MealSuggestionService';
import { useAuth } from './AuthContext';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Define the context type
interface MealSuggestionContextType {
  suggestions: MealSuggestion[];
  fetchRecentSuggestions: () => Promise<void>;
}

// Create the context
const MealSuggestionContext = createContext<MealSuggestionContextType | undefined>(undefined);

// Create a provider component
export const MealSuggestionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([]);
  const { user } = useAuth();

  // Fetch recent suggestions
  const fetchRecentSuggestions = async () => {
    if (!user) return;

    try {
      const recentSuggestions = await MealSuggestionService.fetchRecentSuggestions(user);
      setSuggestions(recentSuggestions);
    } catch (error) {
      console.error('Error fetching recent meal suggestions:', error);
    }
  };

  // Automatically generate and fetch suggestions when user changes or on app open
  useEffect(() => {
    if (user) {
      const generateAndFetchSuggestions = async () => {
        await MealSuggestionService.scheduleDailySuggestions(user);
        await fetchRecentSuggestions();
      };

      generateAndFetchSuggestions();
    }
  }, [user]);

  return (
    <MealSuggestionContext.Provider value={{ 
      suggestions, 
      fetchRecentSuggestions 
    }}>
      {children}
    </MealSuggestionContext.Provider>
  );
};

// Custom hook to use the MealSuggestionContext
export const useMealSuggestions = () => {
  const context = useContext(MealSuggestionContext);
  if (context === undefined) {
    throw new Error('useMealSuggestions must be used within a MealSuggestionProvider');
  }
  return context;
};
