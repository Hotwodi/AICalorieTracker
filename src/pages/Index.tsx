import React, { useState } from 'react';
import ImageUpload from '@/components/ImageUpload';
import MealSuggestionPanel from '@/components/MealSuggestionPanel';
import { MealSuggestionProvider } from '@/context/MealSuggestionContext';
import { MacroDisplay } from "@/components/MacroDisplay";
import { MacroChart } from "@/components/MacroChart";
import { MacroGoals } from "@/components/MacroGoals";
import { Calendar } from "@/components/Calendar";
import { analyzeMealImage, type MealAnalysis } from "@/lib/gemini";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { useFoodLog } from "@/context/FoodLogContext";
import LogoImage from '@/assets/logo.png';

const Index: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<MealAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();
  const { addFoodLogEntry } = useFoodLog();

  const handleImageSelect = (file: File | null) => {
    setSelectedImage(file);
    setAnalysis(null);
  };

  const handleAnalyzeImage = async () => {
    if (!selectedImage) {
      toast({
        title: "No Image Selected",
        description: "Please upload an image first.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsAnalyzing(true);
      const analyzedMeal = await analyzeMealImage(selectedImage);
      
      // Add to food log
      await addFoodLogEntry({
        date: new Date().toISOString(),
        mealType: 'custom',
        ...analyzedMeal
      });

      setAnalysis(analyzedMeal);
      
      toast({
        title: "Meal Analyzed",
        description: "Your meal has been successfully analyzed.",
      });
    } catch (error) {
      console.error('Image analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "Unable to analyze the image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-center mb-8">
        <img 
          src={LogoImage} 
          alt="Snap Nutrition Guide Logo" 
          className="w-48 h-auto"
        />
      </div>
      <MealSuggestionProvider>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="container mx-auto px-4 py-8">
            <Tabs defaultValue="track" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="track">Track Meal</TabsTrigger>
                <TabsTrigger value="progress">View Progress</TabsTrigger>
              </TabsList>

              <TabsContent value="track" className="space-y-4">
                <Card className="p-6">
                  <h2 className="text-2xl font-bold mb-4">Track Your Meal</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <ImageUpload
                        onImageSelect={handleImageSelect}
                        selectedImage={selectedImage}
                        onAnalyze={handleAnalyzeImage}
                        isAnalyzing={isAnalyzing}
                      />
                    </div>
                    {analysis && (
                      <div className="space-y-4">
                        <MacroDisplay
                          calories={analysis.calories}
                          protein={analysis.protein}
                          carbs={analysis.carbs}
                          fat={analysis.fat}
                        />
                        <MacroChart analysis={analysis} />
                        <MealSuggestionPanel />
                      </div>
                    )}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="progress">
                <Card className="p-6">
                  <h2 className="text-2xl font-bold mb-4">Your Progress</h2>
                  <div className="space-y-6">
                    <MacroGoals />
                    <Calendar />
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </MealSuggestionProvider>
    </div>
  );
};

export default Index;