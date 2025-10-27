import {
  DetectFacesCommand,
  // Import DetectLabelsCommand
  DetectLabelsCommand,
  Label,
  RekognitionClient,
} from "@aws-sdk/client-rekognition";
import { Buffer } from "buffer";
import { awsConfig } from "../config";

const rekognition = new RekognitionClient({
  region: awsConfig.region,
  credentials: {
    accessKeyId: awsConfig.accessKeyId,
    secretAccessKey: awsConfig.secretAccessKey,
  },
});

export async function analyzeImageForEmotion(base64: string): Promise<string> {
  const buffer = Buffer.from(base64, 'base64');

  const command = new DetectFacesCommand({
    Image: { Bytes: buffer },
    Attributes: ["ALL"],
  });

  try {
    const response = await rekognition.send(command);
    const faceDetails = response.FaceDetails;

    if (faceDetails && faceDetails.length > 0) {
      const emotions = faceDetails[0].Emotions;
      if (emotions && emotions.length > 0) {
        // Find the emotion with the highest confidence
        const dominantEmotion = emotions.reduce((prev, current) =>
          (prev.Confidence! > current.Confidence!) ? prev : current
        );
        // Return the type of the dominant emotion, or 'DEFAULT' if none found
        return dominantEmotion.Type || 'DEFAULT';
      }
    }
    // Return 'NEUTRAL' if no faces or emotions are detected
    return 'NEUTRAL';
  } catch (error: any) {
    console.error("AWS Rekognition Error (DetectFaces):", error);
    // Throw a more specific error message
    throw new Error(`Failed to analyze image for emotion: ${error.name}`);
  }
}

// New function to analyze image for objects (labels)
export async function analyzeImageForObjects(base64: string): Promise<Label[]> {
  const buffer = Buffer.from(base64, 'base64');

  const command = new DetectLabelsCommand({
    Image: { Bytes: buffer },
    MaxLabels: 10, // Limit the number of labels returned
    MinConfidence: 75, // Set a minimum confidence threshold
  });

  try {
    const response = await rekognition.send(command);
    // Return the detected labels or an empty array if none found
    return response.Labels || [];
  } catch (error: any) {
    console.error("AWS Rekognition Error (DetectLabels):", error);
    // Throw a more specific error message
    throw new Error(`Failed to analyze image for objects: ${error.name}`);
  }
}

// The comment indicating AI assistance can remain or be updated if needed.
// This code is provided from AI
// type AI used Gemini 2.5 pro