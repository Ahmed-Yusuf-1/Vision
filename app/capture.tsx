import { useIsFocused } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Button, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// Import the analysis functions
import { analyzeImageForEmotion, analyzeImageForObjects } from '../lib/rekognition';

export default function CaptureScreen() {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [permission, requestPermission] = useCameraPermissions();
    const router = useRouter();
    const cameraRef = useRef<CameraView>(null);
    const [facing, setFacing] = useState<'front' | 'back'>('front');
    const isFocused = useIsFocused();

    function toggleCameraFacing() {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    }

    if (!permission || !isFocused) {
        return <View />;
    }

    if (!permission.granted) {
        return (
            <View style={styles.grantPermission}>
                <Text style={styles.permissionText}>We need your permission to show the camera</Text>
                <Button onPress={requestPermission} title="Grant Permission" />
            </View>
        );
    }

    const takePictureAndAnalyze = async () => {
        const camera = cameraRef.current;
        if (!isCameraReady || isAnalyzing || !camera) {
            console.warn("Capture aborted: Camera not ready, busy, or ref is null.");
            return;
        }

        // --- Correction Start ---
        // Capture the picture *before* setting isAnalyzing to true
        try {
            const picture = await camera.takePictureAsync({
                quality: 0.7,
                skipProcessing: false,
                shutterSound: false, // Note: shutterSound might not work reliably
            });

            if (!picture || !picture.uri) {
                // Use a more specific error if URI is missing
                throw new Error("Failed to save picture, URI is missing.");
            }

            // NOW set analyzing state and proceed
            setIsAnalyzing(true);

            const base64 = await FileSystem.readAsStringAsync(picture.uri, {
                encoding: 'base64',
            });

             if (!base64) {
                 throw new Error("Failed to get base64 data from file system.");
            }
            // --- Correction End ---

            // Perform both analyses concurrently
            const [emotionResult, objectsResult] = await Promise.all([
                analyzeImageForEmotion(base64),
                analyzeImageForObjects(base64)
            ]);

            console.log('Detected Emotion:', emotionResult);
            console.log('Detected Objects:', objectsResult);

            const objectNames = objectsResult
                .map(label => label.Name)
                .filter((name): name is string => name !== undefined);

            router.replace({
                pathname: '/',
                params: {
                    emotion: emotionResult || 'DEFAULT',
                    objects: objectNames.join(','),
                }
            });

        } catch (error) {
            console.error("Error during picture capture or analysis:", error);
            // Display a generic error message, the specific error is logged
            alert('Could not take or analyze picture. Please try again.');
            // Ensure analyzing state is reset in case of error
            setIsAnalyzing(false);
        }
    };

    if (isAnalyzing) {
        return (
            <View style={styles.analyzingContainer}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.analyzingText}>Analyzing...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                style={styles.camera}
                facing={facing}
                ref={cameraRef}
                onCameraReady={() => setIsCameraReady(true)}
                active={isFocused} // Use 'active' prop
            >
                <View style={styles.controlsContainer}>
                    <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
                        <Image style={styles.flipImage} source={require('../assets/images/CameraFlip.png')} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.captureButton, (!isCameraReady || isAnalyzing) && { opacity: 0.5 }]}
                        onPress={takePictureAndAnalyze}
                        disabled={!isCameraReady || isAnalyzing}
                    >
                        <View style={styles.captureButtonInner} />
                    </TouchableOpacity>

                    <View style={styles.flipButton} />
                </View>
            </CameraView>
        </View>
    );
}

// --- Styles remain the same ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    camera: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    controlsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
        paddingVertical: 20,
        paddingBottom: 40,
    },
    flipButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    flipImage: {
        width: '90%',
        height: '90%',
        resizeMode: 'contain',
        tintColor: 'white',
    },
    captureButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'transparent',
        borderWidth: 4,
        borderColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureButtonInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'white',
    },
    grantPermission: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#11161a',
    },
    permissionText: {
        color: 'white',
        fontSize: 18,
        marginBottom: 12,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    analyzingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#11161a',
    },
    analyzingText: {
        marginTop: 20,
        color: 'white',
        fontSize: 18,
    }
});

// sections of this code is provided from AI
// type AI used Gemini 2.5 pro