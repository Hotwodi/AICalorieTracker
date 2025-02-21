import React, { createContext, useContext, useState, useEffect } from 'react';
import { MealSuggestion, MealSuggestionService } from '@/services/MealSuggestionService';
import { useAuth } from './AuthContext';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Define the context type
interface MealSuggestionContextType {
  suggestions: MealSuggestion[];
  fetchSuggestions: () => Promise<void>;
}

// Create the context
const MealSuggestionContext = createContext<MealSuggestionContextType | undefined>(undefined);

// Provider component
export const MealSuggestionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([]);
  const { user } = useAuth();

  const fetchSuggestions = async () => {
    if (!user) {
      setSuggestions([]);
      return;
    }

    try {
      // Get current hour
      const currentHour = new Date().getHours();
      
      // Generate suggestions based on time of day
      const timeSuggestions = MealSuggestionService.generateTimedSuggestions(currentHour);
      
      setSuggestions(timeSuggestions);
    } catch (error) {
      console.error('Error fetching meal suggestions:', error);
      setSuggestions([]);
    }
  };

  // Fetch suggestions when user changes or on initial load
  useEffect(() => {
    fetchSuggestions();
  }, [user]);

  return (
    <MealSuggestionContext.Provider value={{ suggestions, fetchSuggestions }}>
      {children}
    </MealSuggestionContext.Provider>
  );
};

// Custom hook to use the MealSuggestion context
export const useMealSuggestions = () => {
  const context = useContext(MealSuggestionContext);
  
  if (context === undefined) {
    throw new Error('useMealSuggestions must be used within a MealSuggestionProvider');
  }
  
  return context;
};
