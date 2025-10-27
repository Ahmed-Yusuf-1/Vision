// In lib/gemini.ts
import { geminiConfig } from '../config';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
}

export async function getRefinedObjectLabel(labels: string[]): Promise<string | null> {
  if (!labels || labels.length === 0) {
    return null;
  }

  const labelList = labels.join(', ');
  const prompt = `Given the following labels detected in an image: [${labelList}], identify the single most specific and likely physical object being shown. Prioritize common, tangible items. Return only the name of that single object. If no single specific object seems likely, return "Objects".`;

  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    // generationConfig: { // Optional: Adjust if needed
    //   temperature: 0.5,
    // }
  };

  let responseText = ''; // Variable to hold raw response text

  try {
    const response = await fetch(`${geminiConfig.apiUrl}?key=${geminiConfig.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    // --- Improvement Start ---
    // 1. Get the raw text first, regardless of status
    responseText = await response.text();
    console.log("Raw Gemini API Response Text:", responseText); // Log the raw response

    // 2. Check response.ok AFTER getting text
    if (!response.ok) {
      // Try to parse the error text as JSON, but handle if it's not JSON
      let errorDetails = responseText;
      try {
        errorDetails = JSON.stringify(JSON.parse(responseText)); // Pretty print if JSON
      } catch (parseError) {
        // Ignore parsing error, just use the raw text
      }
      console.error("Gemini API Error Response:", errorDetails);
      throw new Error(`Gemini API request failed with status ${response.status}`);
    }

    // 3. Try parsing the successful response text, catch JSON errors
    let data: GeminiResponse;
    try {
        if (responseText.trim() === '') {
             throw new Error("Received empty response body from Gemini API");
        }
        data = JSON.parse(responseText);
    } catch (parseError: any) {
        console.error("Failed to parse Gemini API JSON response:", parseError);
        console.error("Original response text was:", responseText); // Log again for context
        throw new Error(`Failed to parse Gemini response: ${parseError.message}`);
    }
    // --- Improvement End ---

    const refinedLabel = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    console.log("Gemini Refined Label:", refinedLabel);

    return refinedLabel && refinedLabel.length < 50 ? refinedLabel : "Objects"; // Keep validation

  } catch (error) {
    console.error("Error calling/processing Gemini API:", error);
    // Log the raw text again if available in case of network errors during fetch
    if (responseText) {
        console.error("Raw response text on error:", responseText);
    }
    return null; // Return null on any error during the process
  }
}