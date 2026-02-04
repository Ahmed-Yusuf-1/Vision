# Vision 👁️🎙️

Vision is an AI-powered mobile application built with React Native and Expo that helps users "see" the world through auditory feedback. By capturing a photo, the app analyzes the user's facial expression or the objects in their environment and speaks the results back to them with a touch of personality.

## 🚀 Features

- **Emotion Detection**: Recognizes a wide range of human emotions (Happy, Sad, Angry, Surprised, Calm, etc.) using AWS Rekognition.
- **Intelligent Object Identification**: Beyond simple labeling, the app uses Google Gemini to refine multiple detected tags into a single, most-likely physical object.
- **Voice Synthesis**: Converts detected data into natural speech using Google Cloud Text-to-Speech (HD Chirp models).
- **Concurrent Analysis**: Processes both facial expressions and object detection simultaneously for a comprehensive understanding of the scene.
- **Dynamic Responses**: Features a variety of personality-filled responses based on the detected emotion.

## 🛠️ Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/)
- **Computer Vision**: [AWS Rekognition SDK](https://aws.amazon.com/rekognition/)
- **AI/LLM**: [Google Generative AI (Gemini 2.5 Flash Lite)](https://ai.google.dev/)
- **Audio & Speech**: [Google Cloud Text-to-Speech API](https://cloud.google.com/text-to-speech) and `expo-av`

## 📂 Project Structure

- **/app**: Contains the main application screens including the Home (`index.tsx`) and Camera (`capture.tsx`) interfaces.
- **/lib**: Core logic for API integrations:
  - `rekognition.ts`: Handles AWS facial and label analysis.
  - `gemini.ts`: Refines object labels using generative AI.
  - `googleTTS.ts`: Manages text-to-speech synthesis.
- **/assets**: Stores project images and custom fonts.

## ⚙️ Setup & Installation

1.  **Clone the repository**
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Configure Environment**:
    Create a `config.ts` file (referenced in the source) and provide your API credentials for:
    - AWS Rekognition (Access Key, Secret Key, Region)
    - Google Cloud API Key (for TTS)
    - Google Gemini API Key
4.  **Start the app**:
    ```bash
    npx expo start
    ```

## 🖥️ Usage

1.  Open the app to the **Welcome Screen**.
2.  Tap the **Vision Logo** to open the camera.
3.  Point the camera at yourself or an object and press the **Capture** button.
4.  The app will display "Analyzing..." while it communicates with AWS and Google Cloud.
5.  Listen to the AI describe your emotion or the object it sees!

---
*Developed with assistance from Gemini 2.5 Pro.*
