import React, { useState } from "react";
import { ImageUpload } from "@/components/ImageUpload";
import { MacroDisplay } from "@/components/MacroDisplay";
import { MacroChart } from "@/components/MacroChart";
import { MacroGoals } from "@/components/MacroGoals";
import { Calendar } from "@/components/Calendar";
import { analyzeMealImage, type MealAnalysis } from "@/lib/gemini";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFoodLog } from "@/context/FoodLogContext";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";

const Index = () => {
  console.log("Rendering Index component");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<MealAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();
  const { addFoodLogEntry, addManualFoodEntry, getTodaysMacroTotals } = useFoodLog();
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Assuming this state is already defined somewhere in your code
  const handleSignOut = () => {
    // Assuming this function is already defined somewhere in your code
  };

  const handleImageSelect = (file: File | null) => {
    setSelectedImage(file);
    setAnalysis(null);
  };

  const handleAnalyzeImage = async () => {
    if (!selectedImage) {
      toast({
        title: "No Image Selected",
        description: "Please select an image to analyze.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzeMealImage(selectedImage);
      console.log('Analysis result:', result); // Debug log
      setAnalysis(result);
      
      // Add the meal to the food log
      addFoodLogEntry({
        name: result.description,
        calories: result.calories,
        protein: result.protein,
        carbs: result.carbs,
        fat: result.fat,
        date: new Date().toISOString()
      });

      toast({
        title: "Analysis Complete",
        description: "Your meal has been analyzed and added to your food log.",
      });
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "There was an error analyzing your meal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddManualMeal = () => {
    addManualFoodEntry({
      name: 'Test Meal',
      calories: 500,
      protein: 25,
      carbs: 50,
      fat: 15
    });

    toast({
      title: "Manual Meal Added",
      description: "A test meal has been added to your food log.",
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2>Track Your Meal</h2>
          <div className="text-right">
            <p>View Progress</p>
          </div>
        </div>
        
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
                <Button onClick={handleAddManualMeal} variant="outline">Add Manual Meal</Button>
                {isAuthenticated && (
                  <Button onClick={handleSignOut} variant="destructive" className="mt-4">Sign Out</Button>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;