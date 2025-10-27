// In lib/gemini.ts
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { geminiConfig } from '../config';

// --- Initialize Gemini ---
// Access your API key (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI(geminiConfig.apiKey);

// --- Model Configuration (Optional but Recommended) ---
const generationConfig = {
  // temperature: 1, // Example: Adjust creativity (0 = deterministic, 1 = creative)
  // topP: 0.95,     // Example: Nucleus sampling
  // topK: 64,       // Example: Top-K sampling
  maxOutputTokens: 100, // Limit response length
  // responseMimeType: "text/plain", // Keep response simple
};

// --- Safety Settings (Optional but Recommended) ---
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];


// --- Define the function ---
export async function getRefinedObjectLabel(labels: string[]): Promise<string | null> {
  if (!labels || labels.length === 0) {
    return null;
  }

  // Choose the model - START WITH THIS ONE, then try others if needed
  // Common models: "gemini-1.5-flash-latest", "gemini-pro"
  // Verify the exact name available to you in Google AI Studio / Cloud Console
  const modelName = "gemini-2.5-flash-lite"; // *** TRY THIS FIRST ***
  // const modelName = "gemini-pro"; // Example alternative

  try {
    const model = genAI.getGenerativeModel({
      model: modelName,
      // Pass generationConfig and safetySettings
      generationConfig,
      safetySettings,
    });

    const labelList = labels.join(', ');
    const prompt = `Given the following labels detected in an image: [${labelList}], identify the single most specific and likely physical object being shown. Prioritize common, tangible items. Return only the name of that single object. If no single specific object seems likely, return "Objects".`;

    console.log(`Sending prompt to ${modelName}:`, prompt); // Log the prompt

    const result = await model.generateContent(prompt);
    const response = result.response; // Use await here
    const refinedLabel = response.text().trim(); // Get text response

    console.log("Gemini SDK Response Text:", refinedLabel);

    // Basic validation or return "Objects" if response is weird/empty
    return refinedLabel && refinedLabel.length < 50 && refinedLabel.length > 0 ? refinedLabel : "Objects";

  } catch (error: any) {
  
      // --- Error Handling ---
      console.error(`Error calling Gemini API (${modelName}):`, error);
      // Check for specific API errors if possible (structure might vary)
      if (error.message) {
           console.error("Gemini Error Message:", error.message);
      }
      // You might want to check error.status or error.code if they exist
       return null; // Return null on error
  }
}