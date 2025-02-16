import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY } from "./gemini-config";

export interface MealAnalysis {
  description: string;
  calories: number;  // calories in kcal
  protein: number;   // grams
  fat: number;       // grams
  carbs: number;     // grams
}

const isValidImageFile = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  return validTypes.includes(file.type);
};

const extractJSONFromMarkdown = (text: string): string => {
  // Remove markdown code block syntax and any extra whitespace
  const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
  return jsonMatch ? jsonMatch[1].trim() : text.trim();
};

const validateNutritionValues = (data: any): MealAnalysis => {
  // Ensure all required fields are present
  const requiredFields = ['description', 'calories', 'protein', 'fat', 'carbs'];
  for (const field of requiredFields) {
    if (!(field in data)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Convert and validate each numeric field
  const calories = Math.round(Number(data.calories));
  const protein = Math.round(Number(data.protein));
  const fat = Math.round(Number(data.fat));
  const carbs = Math.round(Number(data.carbs));

  // Validate numeric values
  if (isNaN(calories) || calories <= 0) {
    throw new Error('Invalid calorie value');
  }
  if (isNaN(protein) || protein < 0) {
    throw new Error('Invalid protein value');
  }
  if (isNaN(fat) || fat < 0) {
    throw new Error('Invalid fat value');
  }
  if (isNaN(carbs) || carbs < 0) {
    throw new Error('Invalid carbs value');
  }

  return {
    description: data.description || 'Food item',
    calories,
    protein,
    fat,
    carbs
  };
};

export const analyzeMealImage = async (
  imageFile: File | null
): Promise<MealAnalysis> => {
  try {
    // Validate API key
    if (!GEMINI_API_KEY) {
      throw new Error("Gemini API key is missing. Please set VITE_GEMINI_API_KEY in .env");
    }

    // Validate image file
    if (!imageFile) {
      throw new Error("No image file provided");
    }

    if (!isValidImageFile(imageFile)) {
      throw new Error(`Invalid file type: ${imageFile.type}. Please provide a valid image file (JPEG, PNG, or WebP).`);
    }

    console.log('Starting image analysis...'); // Debug log

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Convert image to base64
    const base64Image = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error('Failed to read image file'));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read image file'));
      
      try {
        reader.readAsDataURL(imageFile);
      } catch (error) {
        reject(new Error('Failed to read image file'));
      }
    });

    const prompt = `Analyze this food image and provide nutritional information. 
      Return ONLY a JSON object in this exact format (no markdown, no code blocks): 
      {"description": string, "calories": number, "protein": number, "fat": number, "carbs": number}
      
      Guidelines:
      - Description should be clear and concise
      - Calories must be in kcal (kilocalories)
      - Protein, fat, and carbs must be in grams
      - All numerical values must be positive numbers
      - Round all numbers to the nearest whole number
      - Example response: {"description": "Grilled chicken breast with rice", "calories": 350, "protein": 30, "fat": 8, "carbs": 40}`;

    console.log('Sending request to Gemini...'); // Debug log

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: imageFile.type,
                data: base64Image.split(",")[1],
              },
            },
          ],
        },
      ],
    });

    const responseText = result.response.text();
    console.log('Raw Gemini response:', responseText); // Debug log
    
    // Extract JSON from markdown if needed and parse
    try {
      const cleanedResponse = extractJSONFromMarkdown(responseText);
      console.log('Cleaned response:', cleanedResponse); // Debug log
      const parsedData = JSON.parse(cleanedResponse);
      console.log('Parsed data:', parsedData); // Debug log
      return validateNutritionValues(parsedData);
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", responseText);
      throw new Error(`Invalid response format: ${parseError.message}`);
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};