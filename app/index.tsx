import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function WelcomeScreen() {
    const router = useRouter();
    const { emotion } = useLocalSearchParams<{ emotion?: string }>();
    const [currentEmotion, setCurrentEmotion] = useState<string | null>(null);

    useEffect(() => {
        if (emotion) {
            handleEmotion(emotion);
        }
    }, [emotion]);


    const handleEmotion = async (detectedEmotion: string) => {
        setCurrentEmotion(detectedEmotion);
        let message = "Hey you";

        // Map Rekognition emotions to alert messages
        switch (detectedEmotion.toUpperCase()) {
            case 'HAPPY':
                message = "That smile is brighter than my future. Keep it up!";
                break;
            case 'SAD':
                message = "On the bright side, you're saving a lot of facial muscle energy.";
                break;
            case 'ANGRY':
                message = "I see you're practicing your supervillain glare. It's working.";
                break;
            case 'SURPRISED':
                message = "You look like you just remembered an embarrassing moment from 2008.";
                break;
            case 'CALM':
                message = "Please share your secrets. My Roomba has more anxiety than you do.";
                break;
            case 'FEAR':
                message = "You look like you just saw your weekly screen time report.";
                break;
            case 'DISGUST':
                message = "That's the face of someone who just stepped on something wet while wearing socks";
                break;
            default:
                message = "I actually don't know what you're doing right now";
                break;
        }


        Alert.alert(
            "Mood Detected!",
            `Hey You, you seem to be ${detectedEmotion.toLowerCase()}.  ${message}!`
        );
    };

    const HandleAnalyzeMood = () => {
        setCurrentEmotion(null);
        router.push('/capture');
    };

    return (
        <View style={styles.container}>
                    <TouchableOpacity style={styles.logoContainer} onPress={HandleAnalyzeMood}>
                        <Image style={styles.logo} source={require('../assets/images/vision.png')} />
                    </TouchableOpacity>
                    <Text style={styles.promptText}>Press the button above to start.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#181313ff', // Assuming a VideoBackground component provides the background
        paddingTop: 80,
    },
    welcomeText: {
        color: 'white',
        fontSize: 28,
        fontWeight: 'bold',
        position: 'absolute',
        top: 80,
    },
    logoContainer: {
        width: '60%',
        aspectRatio: 1,
        marginBottom: 20,
    },
    logo: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    promptText: {
        color: 'white',
        fontSize: 22,
        textAlign: 'center',
    },
    resultsContainer: {
        flex: 1,
        width: '90%',
        justifyContent: 'center', // Center the content vertically
        alignItems: 'center',     // Center the content horizontally
        marginTop: 20,
    },
    emotionText: {
        color: 'white',
        fontSize: 24, // Made text slightly larger for emphasis
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 40, // Increased margin to space it from the button
    },
    retryButton: {
        backgroundColor: 'purple', // A green color, you can change it
        borderRadius: 25,
        paddingVertical: 15,
        paddingHorizontal: 40, // Added horizontal padding
        alignItems: 'center',
        marginTop: 20,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    }
});