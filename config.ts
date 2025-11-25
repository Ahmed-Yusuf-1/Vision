
// A helper function to safely get variables from the app manifest (app.json).
function getEnvVar(key: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing environment variable: ${key}. Please check your .env file.`);
  }
  return value;
};

// Define and export your configuration variables.
export const awsConfig = {
  accessKeyId: getEnvVar('EXPO_PUBLIC_AWS_ACCESS_KEY_ID', process.env.EXPO_PUBLIC_AWS_ACCESS_KEY_ID),
  secretAccessKey: getEnvVar('EXPO_PUBLIC_AWS_SECRET_ACCESS_KEY', process.env.EXPO_PUBLIC_AWS_SECRET_ACCESS_KEY),
  region: 'us-east-2', 
};

export const geminiConfig = {
  apiKey: getEnvVar('EXPO_PUBLIC_GEMINI_API_KEY', process.env.EXPO_PUBLIC_GEMINI_API_KEY),
};
export const googleCloudConfig = {
  // reusing the Gemini key as requested, ensure Cloud Text-to-Speech API is enabled for this key
  apiKey: getEnvVar('EXPO_PUBLIC_GOOGLE_TTS_API_KEY', process.env.EXPO_PUBLIC_GOOGLE_TTS_API_KEY), 
};
// This code is provided from AI
// type AI used Gemini 2.5 pro