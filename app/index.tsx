// app/index.tsx

import { Audio } from 'expo-av'; // Import Audio
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getRefinedObjectLabel } from "../lib/gemini";
import { fetchAudioFromText } from "../lib/googleTTS"; // Import TTS function

// Define states that indicate no specific emotion was detected
const NON_SPECIFIC_EMOTION_STATES = ['NEUTRAL', 'DEFAULT'];

function getRandomArrayElement<T>(arr: T[]): T | undefined {
    if (!arr || arr.length === 0) return undefined;
    const index = Math.floor(Math.random() * arr.length);
    return arr[index];
}

const choices = ["think", "believe", "suspect"];

export default function WelcomeScreen() {
    const router = useRouter();
    const { emotion, objects } = useLocalSearchParams<{ emotion?: string; objects?: string }>();

    const [currentEmotion, setCurrentEmotion] = useState<string | null>(null);
    const [detectedObjects, setDetectedObjects] = useState<string[]>([]);
    const [primaryDetection, setPrimaryDetection] = useState<'initial' | 'emotion' | 'objects'>('initial');
    const [refinedObjectLabel, setRefinedObjectLabel] = useState<string | null>(null);
    const [isRefiningLabel, setIsRefiningLabel] = useState(false);
    
    // Keep track of the sound object to unload it later
    const [sound, setSound] = useState<Audio.Sound | null>(null);

    // Cleanup sound when component unmounts
    useEffect(() => {
        return () => {
            if (sound) {
                console.log('Unloading Sound');
                sound.unloadAsync();
            }
        };
    }, [sound]);

    useEffect(() => {
        let emotionResult: string | null = null;
        let objectList: string[] = [];
        let isSpecificEmotion = false;
        

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
            setDetectedObjects(objectList); 
        } else {
            setDetectedObjects([]);
        }

        // --- Logic Flow ---
        if (isSpecificEmotion) {
            setPrimaryDetection('emotion');
            setIsRefiningLabel(false);
            handleEmotionResponse(emotionResult!);
        } else if (objectList.length > 0) {
            setPrimaryDetection('objects');
            setIsRefiningLabel(true); 

            // Call Gemini to refine label
            getRefinedObjectLabel(objectList)
                .then(refinedLabel => {
                    if (refinedLabel && refinedLabel !== "Objects") { 
                         setRefinedObjectLabel(refinedLabel); 
                         handleObjectResponse(refinedLabel); 
                    } else {
                        handleObjectResponse(null, objectList); 
                         setRefinedObjectLabel(null); 
                    }
                })
                .catch(err => {
                    console.error("Failed to get refined label:", err);
                    handleObjectResponse(null, objectList); 
                     setRefinedObjectLabel(null);
                })
                .finally(() => {
                    setIsRefiningLabel(false); 
                });

        } else if (emotionResult) { 
            setPrimaryDetection('emotion');
            setIsRefiningLabel(false);
            // Optional: Handle neutral emotion speech if desired
        } else {
            setPrimaryDetection('initial');
            setIsRefiningLabel(false);
        }

    }, [emotion, objects]); 

    // Function to play TTS audio
    const playVoiceMessage = async (text: string) => {
        try {
            const audioContent = await fetchAudioFromText(text);
            
            if (audioContent) {
                console.log('Loading Sound');
                
                // Unload previous sound if exists
                if (sound) {
                    await sound.unloadAsync();
                }

                // Create and play new sound from base64
                const { sound: newSound } = await Audio.Sound.createAsync(
                    { uri: `data:audio/mp3;base64,${audioContent}` },
                    { shouldPlay: true }
                );
                setSound(newSound);
            }
        } catch (error) {
            console.error("Failed to play TTS:", error);
        }
    };

    // Handle Emotion Response (Speech instead of Alert)
    const handleEmotionResponse = (detectedEmotion: string) => {
        if (detectedEmotion.toUpperCase() === 'NEUTRAL') return;

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
        
        const fullMessage = `You seem to be ${detectedEmotion.toLowerCase()}. ${message}`;
        playVoiceMessage(fullMessage);
    };

    // Handle Object Response (Speech instead of Alert)
    const handleObjectResponse = (refinedLabel: string | null, originalObjects?: string[]) => {
        let speechMessage = "I couldn't identify a specific object, but I see some things.";
        const randomChoice = getRandomArrayElement(choices);

        if (refinedLabel) {
            speechMessage = `I ${randomChoice} that's ${refinedLabel}.`;
        } else if (originalObjects && originalObjects.length > 0) {
            if (originalObjects.length === 1) {
                speechMessage = `I can see a ${originalObjects[0]}.`;
            } else if (originalObjects.length === 2) {
                speechMessage = `I can see a ${originalObjects[0]} and a ${originalObjects[1]}.`;
            } else {
                const lastObject = originalObjects[originalObjects.length - 1];
                const initialObjects = originalObjects.slice(0, -1);
                speechMessage = `I can see a ${initialObjects.join(', a ')}, and a ${lastObject}.`;
            }
        }
        
        playVoiceMessage(speechMessage);
    };

    const HandleAnalyzeAgain = async () => {
        // Stop any playing sound when navigating away
        if (sound) {
            await sound.stopAsync();
            await sound.unloadAsync();
            setSound(null);
        }

        setCurrentEmotion(null);
        setDetectedObjects([]);
        setPrimaryDetection('initial');
        setRefinedObjectLabel(null);
        setIsRefiningLabel(false);
        router.push('/capture');
    };

    const renderResults = () => {
        if (isRefiningLabel) {
            return <ActivityIndicator size="large" color="#6200EE" style={{ marginVertical: 30 }} />;
        }

       switch (primaryDetection) {
            case 'emotion':
                 return ( 
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
                                {detectedObjects.slice(0, 3).map((obj, index) => (
                                    <Text key={index} style={styles.objectItem}>- {obj}</Text>
                                ))}
                                {detectedObjects.length > 3 && <Text style={styles.objectItem}>...</Text>}
                            </View>
                        )}
                    </>
                 );
            case 'objects':
                 return ( 
                     <View style={styles.objectsSection}>
                        <Text style={styles.objectsTitle}>Detected:</Text>
                        {refinedObjectLabel ? (
                            <Text style={styles.objectItem}>{refinedObjectLabel}</Text>
                        ) : (
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

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.logoContainer} onPress={HandleAnalyzeAgain}>
                <Image style={styles.logo} source={require('../assets/images/vision.png')} />
            </TouchableOpacity>
            
            <View style={styles.resultsContainer}>
                {renderResults()}
            </View>

            <Text style={styles.promptText}>Tap the logo to analyze your surroundings or your emotion.</Text>
        </View>
    );
}

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
        marginBottom: 10, // Reduced margin
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
        marginTop: 20,
    },
    resultsContainer: {
        minHeight: 150, // Reserve space for results
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
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
        textAlign: 'center', 
    },
    secondaryInfo: {
        opacity: 0.7,
        marginTop: 10,
        marginBottom: 20,
    },
});