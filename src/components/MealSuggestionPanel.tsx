import React from 'react';
import { useMealSuggestions } from '@/context/MealSuggestionContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MealSuggestion } from '@/services/MealSuggestionService';

const MealTypeIcon = {
  'breakfast': '🍳',
  'lunch': '🥗',
  'dinner': '🍽️',
  'snack': '🥨',
  'late-night': '🌙'
};

export const MealSuggestionPanel: React.FC = () => {
  const { suggestions } = useMealSuggestions();

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-4">
      <CardHeader>
        <CardTitle className="text-lg font-bold">
          Today's Meal Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <div 
              key={index} 
              className="flex items-center p-3 bg-gray-100 rounded-lg"
            >
              <div className="mr-4 text-3xl">
                {MealTypeIcon[suggestion.type]}
              </div>
              <div>
                <h3 className="font-semibold">{suggestion.name}</h3>
                <p className="text-sm text-gray-600">
                  {suggestion.reason}
                </p>
                <div className="text-xs text-gray-500 mt-1">
                  {suggestion.calories} cal | 
                  {suggestion.protein}g P | 
                  {suggestion.carbs}g C | 
                  {suggestion.fat}g F
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MealSuggestionPanel;
