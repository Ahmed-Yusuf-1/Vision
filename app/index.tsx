import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native"; // Added ActivityIndicator
import { getRefinedObjectLabel } from "../lib/gemini"; // Import the new function

// Define states that indicate no specific emotion was detected
const NON_SPECIFIC_EMOTION_STATES = ['NEUTRAL', 'DEFAULT'];

function getRandomArrayElement<T>(arr: T[]): T | undefined {
    if (!arr || arr.length === 0) return undefined;
    const index = Math.floor(Math.random() * arr.length);
    return arr[index];
}

const choices = ["think", "believe", "suspect"];
const randomChoice = getRandomArrayElement(choices)
console.log(randomChoice)

export default function WelcomeScreen() {
    const router = useRouter();
    const { emotion, objects } = useLocalSearchParams<{ emotion?: string; objects?: string }>();

    const [currentEmotion, setCurrentEmotion] = useState<string | null>(null);
    const [detectedObjects, setDetectedObjects] = useState<string[]>([]);
    const [primaryDetection, setPrimaryDetection] = useState<'initial' | 'emotion' | 'objects'>('initial');
    // State for the refined object label from Gemini
    const [refinedObjectLabel, setRefinedObjectLabel] = useState<string | null>(null);
    // Loading state specifically for Gemini call
    const [isRefiningLabel, setIsRefiningLabel] = useState(false);


    useEffect(() => {
        let emotionResult: string | null = null;
        let objectList: string[] = [];
        let isSpecificEmotion = false;
        

        // Reset refined label on new analysis
        setRefinedObjectLabel(null);

        // Process emotion
        if (emotion) {
            emotionResult = emotion;
            setCurrentEmotion(emotion);
            isSpecificEmotion = !NON_SPECIFIC_EMOTION_STATES.includes(emotion.toUpperCase());
        } else {
            setCurrentEmotion(null);
        }

        // Process objects
        if (objects) {
            objectList = objects.split(',').filter(obj => obj.trim() !== '');
            setDetectedObjects(objectList); // Store original list for potential display
            console.log("Objects received:", objectList);
        } else {
            setDetectedObjects([]);
        }

        // --- Alert and Refinement Logic ---
        if (isSpecificEmotion) {
            handleEmotionAlert(emotionResult!);
            setPrimaryDetection('emotion');
            setIsRefiningLabel(false); // No refinement needed
        } else if (objectList.length > 0) {
            setPrimaryDetection('objects'); // Set primary detection first
            setIsRefiningLabel(true); // Indicate refinement is starting

            // Call Gemini asynchronously to refine the label
            getRefinedObjectLabel(objectList)
                .then(refinedLabel => {
                    if (refinedLabel && refinedLabel !== "Objects") { // Check if Gemini provided a specific label
                         setRefinedObjectLabel(refinedLabel); // Store the refined label
                         handleObjectAlert(refinedLabel); // Show alert with the single refined label
                    } else {
                        // If Gemini couldn't refine or returned "Objects", show generic alert or raw list
                        handleObjectAlert(null, objectList); // Pass original list
                         setRefinedObjectLabel(null); // Ensure no refined label is stored
                    }
                })
                .catch(err => {
                    console.error("Failed to get refined label:", err);
                    handleObjectAlert(null, objectList); // Fallback to raw list on error
                     setRefinedObjectLabel(null);
                })
                .finally(() => {
                    setIsRefiningLabel(false); // Refinement finished (success or fail)
                });

        } else if (emotionResult) { // Neutral/Default emotion only
            setPrimaryDetection('emotion');
            setIsRefiningLabel(false);
        } else {
            setPrimaryDetection('initial');
            setIsRefiningLabel(false);
        }

    }, [emotion, objects]); // Dependencies remain the same

    // Alert function specifically for emotions (remains the same)
    const handleEmotionAlert = (detectedEmotion: string) => {
        if (detectedEmotion.toUpperCase() === 'NEUTRAL') {
            return;
        }
        let message = "I actually don't know what you're doing right now";
        switch (detectedEmotion.toUpperCase()) {
           case 'HAPPY': message = "That smile is brighter than my future. Keep it up!"; break;
           case 'SAD': message = "On the bright side, you're saving a lot of facial muscle energy."; break;
           case 'ANGRY': message = "I see you're practicing your supervillain glare. It's working."; break;
           case 'SURPRISED': message = "You look like you just remembered an embarrassing moment from 2008."; break;
           case 'CALM': message = "Please share your secrets. My Roomba has more anxiety than you do."; break;
           case 'FEAR': message = "You look like you just saw your weekly screen time report."; break;
           case 'DISGUST': message = "That's the face of someone who just stepped on something wet while wearing socks"; break;
           case 'DEFAULT': message = "Hmm, couldn't quite read that expression."; break;
        }
        Alert.alert("Mood Detected!", `You seem to be ${detectedEmotion.toLowerCase()}. ${message}`);
    };

    // Updated alert function for objects - takes refined label OR original list
    const handleObjectAlert = (refinedLabel: string | null, originalObjects?: string[]) => {
        let alertMessage = "I couldn't identify a specific object, but I see some things.";
        let alertTitle = "Objects Detected!";

        if (refinedLabel) {
            // Use the single refined label from Gemini
            alertMessage = `I ${randomChoice} that's ${refinedLabel}.`;
            alertTitle = `Object Detected: ${refinedLabel}`; // More specific title
        } else if (originalObjects && originalObjects.length > 0) {
            // Fallback: Generate sentence from the original list (if refinement failed or wasn't specific)
            if (originalObjects.length === 1) {
                alertMessage = `I can see a ${originalObjects[0]}.`;
            } else if (originalObjects.length === 2) {
                alertMessage = `I can see a ${originalObjects[0]} and a ${originalObjects[1]}.`;
            } else {
                const lastObject = originalObjects[originalObjects.length - 1];
                const initialObjects = originalObjects.slice(0, -1);
                alertMessage = `I can see a ${initialObjects.join(', a ')}, and a ${lastObject}.`;
            }
        } else {
            // Should not happen if called correctly, but fallback just in case
            return;
        }

        Alert.alert(alertTitle, alertMessage);
    };


    const HandleAnalyzeAgain = () => {
        setCurrentEmotion(null);
        setDetectedObjects([]);
        setPrimaryDetection('initial');
        setRefinedObjectLabel(null); // Reset refined label
        setIsRefiningLabel(false); // Reset loading state
        router.push('/capture');
    };

    // Render results - show loading indicator while refining
    const renderResults = () => {
        if (isRefiningLabel) {
            return <ActivityIndicator size="large" color="#6200EE" style={{ marginVertical: 30 }} />;
        }

       switch (primaryDetection) {
            case 'emotion':
                 return ( /* ... emotion rendering logic ... */
                    <>
                        {currentEmotion && (
                             <Text style={styles.emotionText}>
                                {currentEmotion.toUpperCase() === 'NEUTRAL' || currentEmotion.toUpperCase() === 'DEFAULT'
                                    ? `Expression seems ${currentEmotion?.toLowerCase()}`
                                    : `You look ${currentEmotion?.toLowerCase()}`}
                             </Text>
                        )}
                        {detectedObjects.length > 0 && (
                            <View style={[styles.objectsSection, styles.secondaryInfo]}>
                                <Text style={styles.objectsTitle}>Also Detected:</Text>
                                {detectedObjects.slice(0, 3).map((obj, index) => ( // Show original list here
                                    <Text key={index} style={styles.objectItem}>- {obj}</Text>
                                ))}
                                {detectedObjects.length > 3 && <Text style={styles.objectItem}>...</Text>}
                            </View>
                        )}
                    </>
                 );
            case 'objects':
                 return ( // Display refined label if available, otherwise original list
                     <View style={styles.objectsSection}>
                        <Text style={styles.objectsTitle}>Detected:</Text>
                        {refinedObjectLabel ? (
                            <Text style={styles.objectItem}>{refinedObjectLabel}</Text>
                        ) : (
                            // Fallback to showing original list if refinement failed/was generic
                            detectedObjects.map((obj, index) => (
                                <Text key={index} style={styles.objectItem}>- {obj}</Text>
                            ))
                        )}
                    </View>
                 );
            case 'initial':
            default:
                return null;
        }
    };

    // Main render logic (remains the same)
    return (
        <View style={styles.container}>
                    <TouchableOpacity style={styles.logoContainer} onPress={HandleAnalyzeAgain}>
                        <Image style={styles.logo} source={require('../assets/images/vision2.png')} />
                    </TouchableOpacity>
                    <Text style={styles.promptText}>Tap the logo to analyze your surroundings or your emotion.</Text>
        </View>
    );
}

// --- Styles remain the same ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffffff',
        paddingTop: 60,
        paddingHorizontal: 20,
    },
    logoContainer: {
        width: '60%',
        aspectRatio: 1.5,
        marginBottom: 30,
    },
    logo: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    promptText: {
        color: '#000000ff',
        fontSize: 15,
        textAlign: 'center',
        marginTop: 10,
    },
    resultsContainer: {
        flexGrow: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
    },
    emotionText: {
        color: '#111',
        fontSize: 26,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    objectsSection: {
        marginTop: 15,
        marginBottom: 30,
        alignItems: 'center',
        width: '90%',
    },
    objectsTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#444',
        marginBottom: 10,
    },
    objectItem: {
        fontSize: 16,
        color: '#555',
        marginBottom: 5,
        textAlign: 'center', // Center single refined label or list items
    },
    secondaryInfo: {
        opacity: 0.7,
        marginTop: 10,
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#6200EE',
        borderRadius: 25,
        paddingVertical: 12,
        paddingHorizontal: 35,
        alignItems: 'center',
        marginTop: 20,
        minWidth: 150,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    }
});