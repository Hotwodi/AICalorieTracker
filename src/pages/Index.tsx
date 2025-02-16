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

const Index = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<MealAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();
  const { addFoodItem, getTodaysMacroTotals } = useFoodLog();

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
      addFoodItem({
        name: result.description,
        calories: result.calories,
        protein: result.protein,
        carbs: result.carbs,
        fat: result.fat
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

  return (
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
  );
};

export default Index;