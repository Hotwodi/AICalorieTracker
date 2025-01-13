import React, { useState } from "react";
import { ImageUpload } from "@/components/ImageUpload";
import { MacroDisplay } from "@/components/MacroDisplay";
import { MacroChart } from "@/components/MacroChart";
import { MacroGoals } from "@/components/MacroGoals";
import { Calendar } from "@/components/Calendar";
import { analyzeMealImage, type MealAnalysis } from "@/lib/gemini";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FoodLogProvider, useFoodLog } from "@/context/FoodLogContext";
import { useAuth } from "@/context/AuthContext";

const IndexContent = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<MealAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const { addFoodItem } = useFoodLog();
  const { user, logout } = useAuth();

  const handleImageSelect = (file: File | null) => {
    setSelectedImage(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
    } else {
      setImageUrl(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) {
      toast({
        title: "No image selected",
        description: "Please upload an image first",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzeMealImage(selectedImage);
      setAnalysis(result);
      
      addFoodItem({
        name: result.description || 'Unidentified Meal',
        calories: result.calories || 0,
        protein: result.protein || 0,
        carbs: result.carbs || 0,
        fat: result.fat || 0,
      });

      toast({
        title: "Analysis complete",
        description: "Your meal has been analyzed and added to your food log",
      });
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis failed",
        description: error?.message || "There was an error analyzing your meal",
        variant: "destructive",
      });
      setAnalysis(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setAnalysis(null);
    setImageUrl(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/20">
      <div className="container py-8 space-y-8 animate-fade-in">
        <div className="flex justify-between items-center">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">AI Calorie Tracker</h1>
            <p className="text-muted-foreground">Welcome, {user?.name || 'User'}</p>
          </div>
          <Button 
            variant="destructive" 
            size="icon" 
            onClick={logout}
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        <Tabs defaultValue="analyze" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analyze">Analyze Meal</TabsTrigger>
            <TabsTrigger value="goals">Daily Goals</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
          </TabsList>

          <TabsContent value="analyze">
            {!analysis ? (
              <Card className="p-6 space-y-6">
                <ImageUpload
                  selectedImage={selectedImage}
                  onImageSelect={handleImageSelect}
                />

                <div className="flex justify-center">
                  <Button
                    onClick={handleAnalyze}
                    disabled={!selectedImage || isAnalyzing}
                    className="w-full max-w-sm"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      "Analyze Meal"
                    )}
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-8 animate-fade-up">
                <div className="grid gap-8">
                  <MacroDisplay
                    calories={analysis.calories}
                    protein={analysis.protein}
                    carbs={analysis.carbs}
                    fat={analysis.fat}
                  />
                  <div className="border-t pt-6">
                    <MacroChart
                      protein={analysis.protein}
                      carbs={analysis.carbs}
                      fat={analysis.fat}
                    />
                  </div>
                </div>

                <Card className="overflow-hidden">
                  <div className="p-6 space-y-4">
                    <div className="text-center space-y-2">
                      <h2 className="text-2xl font-semibold">Recent Meal</h2>
                      <p className="text-muted-foreground">{analysis.description}</p>
                    </div>
                    {imageUrl && (
                      <div className="relative aspect-video w-full max-w-2xl mx-auto rounded-lg overflow-hidden">
                        <img
                          src={imageUrl}
                          alt="Analyzed meal"
                          className="object-cover w-full h-full"
                        />
                      </div>
                    )}
                  </div>
                </Card>

                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="w-full max-w-sm"
                  >
                    Analyze Another Meal
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="goals">
            <MacroGoals />
          </TabsContent>

          <TabsContent value="calendar">
            <Calendar />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const Index = () => (
  <FoodLogProvider>
    <IndexContent />
  </FoodLogProvider>
);

export default Index;