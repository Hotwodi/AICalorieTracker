import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ImageUpload } from "@/components/ImageUpload";
import { MacroDisplay } from "@/components/MacroDisplay";
import { analyzeMealImage, type MealAnalysis } from "@/lib/gemini";
import { useToast } from "@/components/ui/use-toast";
import { useFoodLog } from "@/context/FoodLogContext";
import { auth, db } from "@/lib/firebase"; // Ensure Firebase is initialized
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const MealAnalyzer = () => {
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
        description: "Please select an image to analyze.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzeMealImage(selectedImage);
      setAnalysis(result);

      const user = auth.currentUser;
      if (!user) {
        throw new Error("User is not authenticated.");
      }

      // Create a new food log entry
      const newEntry = {
        userId: user.uid, // Firestore security rules require this
        name: result.description,
        calories: result.calories,
        protein: result.protein,
        carbs: result.carbs,
        fat: result.fat,
        ingredients: result.ingredients || [], // Ensure ingredients are included
        timestamp: serverTimestamp(), // Firestore timestamp
        date: new Date().toISOString() // Ensure date is included
      };

      // Save entry to Firestore
      const docRef = await addDoc(collection(db, "foodLogs"), newEntry);

      // Update local state/context
      addFoodLogEntry({ id: docRef.id, ...newEntry });

      toast({
        title: "Analysis Complete",
        description: "Your meal has been analyzed and saved.",
      });
    } catch (error) {
      console.error("Error analyzing image:", error);
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
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Analyze Your Meal</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <ImageUpload 
            selectedImage={selectedImage} 
            onImageSelect={handleImageSelect} 
            onAnalyze={handleAnalyzeImage} 
            isAnalyzing={isAnalyzing} 
          />
          {analysis && <MacroDisplay 
            calories={analysis.calories} 
            protein={analysis.protein} 
            carbs={analysis.carbs} 
            fat={analysis.fat} 
          />}
        </div>
      </div>
    </Card>
  );
};

export default MealAnalyzer;
