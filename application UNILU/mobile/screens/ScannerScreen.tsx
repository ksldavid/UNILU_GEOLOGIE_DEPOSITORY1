import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Dimensions, Animated, Easing, Alert, ActivityIndicator } from 'react-native';
import { ChevronLeft, ZoomIn, ZoomOut, X } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { attendanceService } from '../services/attendance';

const { width, height } = Dimensions.get('window');
const SCAN_SIZE = width * 0.7;

export function ScannerScreen({ navigation, deepLinkToken }: any) {
    const [permission, requestPermission] = useCameraPermissions();
    const [locationPermission, requestLocationPermission] = Location.useForegroundPermissions();
    const [scanned, setScanned] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showCancelled, setShowCancelled] = useState(false);
    const [zoom, setZoom] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [scanError, setScanError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const scanLineAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Animation du laser
    useEffect(() => {
        const startAnimation = () => {
            scanLineAnim.setValue(0);
            Animated.loop(
                Animated.sequence([
                    Animated.timing(scanLineAnim, {
                        toValue: 1,
                        duration: 2000,
                        easing: Easing.linear,
                        useNativeDriver: true,
                    }),
                    Animated.timing(scanLineAnim, {
                        toValue: 0,
                        duration: 2000,
                        easing: Easing.linear,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        };

        startAnimation();

        // Animation de pulsation du cadre
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Demander toutes les permissions au chargement
        (async () => {
            await requestPermission();
            await requestLocationPermission();
        })();
    }, []);

    // 🆕 Traiter automatiquement le token si le scan vient de l'appareil photo natif (Android/iPhone)
    useEffect(() => {
        if (deepLinkToken && !scanned && !isProcessing) {
            handleBarCodeScanned({ data: deepLinkToken });
        }
    }, [deepLinkToken]);

    if (!permission || !locationPermission) {
        return <View style={styles.container}><ActivityIndicator size="large" color="#0d9488" /></View>;
    }

    if (!permission.granted || !locationPermission.granted) {
        return (
            <View style={styles.container}>
                <View style={styles.permissionContainer}>
                    <Text style={styles.message}>L'accès à la caméra et à la position est nécessaire.</Text>
                    <TouchableOpacity
                        style={styles.permissionButton}
                        onPress={async () => {
                            await requestPermission();
                            await requestLocationPermission();
                        }}
                    >
                        <Text style={styles.permissionButtonText}>Accorder les accès</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const handleCancel = () => {
        setScanned(true); // Stop scanning
        setShowCancelled(true);
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
        }).start();

        setTimeout(() => {
            navigation.goBack();
        }, 2000);
    };



    const handleBarCodeScanned = async ({ data }: any) => {
        if (scanned || showCancelled || isProcessing) return;

        setIsProcessing(true);
        setScanError(null);

        try {
            // 1. Obtenir la position précise avec un timeout
            let location;
            try {
                location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced, // Un peu plus rapide que High
                });
            } catch (err) {
                // Fallback si le GPS est capricieux
                location = await Location.getLastKnownPositionAsync();
            }

            if (!location) {
                throw new Error("Impossible d'obtenir votre position.");
            }

            // Clean QR Data (if it's a URL, extract the token)
            let qrToken = data;

            // Support for new URL format (iPhone compatible): .../scan?t=TOKEN
            if (data.includes('t=')) {
                qrToken = data.split('t=')[1].split('&')[0];
            } else if (data.includes('token=')) {
                qrToken = data.split('token=')[1].split('&')[0];
            } else if (data.includes('/')) {
                // Fallback for path based tokens if any (e.g., old format)
                const parts = data.split('/');
                qrToken = parts[parts.length - 1];
            }

            // 2. Envoyer au backend
            try {
                const result = await attendanceService.scanQR(qrToken, location.coords.latitude, location.coords.longitude);

                // Succès
                setIsProcessing(false);
                setScanned(true);
                setSuccessMessage(result.message);
                setShowSuccess(true);
                fadeAnim.setValue(0);
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }).start();

                setTimeout(() => {
                    navigation.goBack();
                }, 4000); // Increased to give time to read feedback

            } catch (error: any) {
                // Erreur (ex: trop loin, déjà fait, etc.)
                // Si erreur réseau, on propose de sauvegarder hors-ligne
                if (error.message.includes('network') || error.message.includes('fetch')) {
                    Alert.alert(
                        "Mode Hors-ligne",
                        "Vous semblez être hors-ligne. Voulez-vous enregistrer votre présence localement pour une synchronisation ultérieure ?",
                        [
                            { text: "Annuler", onPress: () => setIsProcessing(false) },
                            {
                                text: "Enregistrer",
                                onPress: async () => {
                                    setIsProcessing(false);
                                    await attendanceService.saveOfflineScan(qrToken, location.coords.latitude, location.coords.longitude);
                                    setScanned(true);
                                    setShowSuccess(true);
                                    // On peut ajuster le texte ici si besoin
                                }
                            }
                        ]
                    );
                } else {
                    setScanError(error.message);
                    // On ne réinitialise PAS setIsProcessing ici, mais dans le callback de l'alerte
                    Alert.alert(
                        "Échec du scan",
                        error.message,
                        [{
                            text: "OK", onPress: () => {
                                setIsProcessing(false);
                                setScanned(false);
                            }
                        }]
                    );
                }
            }
        } catch (error: any) {
            Alert.alert(
                "Erreur",
                "Impossible de procéder au scan.",
                [{
                    text: "OK", onPress: () => {
                        setIsProcessing(false);
                        setScanned(false);
                    }
                }]
            );
        }
    };

    const translateY = scanLineAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, SCAN_SIZE],
    });

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {!showSuccess && !showCancelled && (
                <View style={StyleSheet.absoluteFill}>
                    <CameraView
                        style={StyleSheet.absoluteFill}
                        facing="back"
                        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                        barcodeScannerSettings={{
                            barcodeTypes: ["qr"],
                        }}
                        zoom={zoom}
                    />

                    {/* Scan Overlay (Non-interactive) */}
                    <View style={styles.overlayContainer} pointerEvents="none">
                        <View style={styles.overlayTop} />
                        <View style={styles.overlayMiddle}>
                            <View style={styles.overlaySide} />
                            <Animated.View style={[styles.scanArea, { transform: [{ scale: pulseAnim }] }]}>
                                <View style={[styles.corner, styles.topLeft]} />
                                <View style={[styles.corner, styles.topRight]} />
                                <View style={[styles.corner, styles.bottomLeft]} />
                                <View style={[styles.corner, styles.bottomRight]} />

                                {/* Guide Lines */}
                                <View style={styles.guideLineH} />
                                <View style={styles.guideLineV} />

                                <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]} />
                            </Animated.View>
                            <View style={styles.overlaySide} />
                        </View>
                        <View style={styles.overlayBottom} />
                    </View>

                    {/* UI Layer (Interactive) */}
                    <SafeAreaView style={styles.uiLayer}>
                        <View style={styles.topBar}>
                            <TouchableOpacity onPress={handleCancel} style={styles.iconButton} activeOpacity={0.7}>
                                <ChevronLeft color="white" size={28} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.bottomControls}>
                            <Text style={styles.instructionText}>
                                Scannez le QR Code de présence
                            </Text>

                            {/* Zoom Controls */}
                            <View style={styles.zoomContainer}>
                                <TouchableOpacity
                                    onPress={() => setZoom(prev => Math.max(0, prev - 0.1))}
                                    style={styles.zoomButton}
                                    activeOpacity={0.7}
                                >
                                    <ZoomOut color="white" size={20} />
                                </TouchableOpacity>
                                <View style={styles.zoomTrack}>
                                    <View style={[styles.zoomFill, { width: `${zoom * 100}%` }]} />
                                </View>
                                <TouchableOpacity
                                    onPress={() => setZoom(prev => Math.min(1, prev + 0.1))}
                                    style={styles.zoomButton}
                                    activeOpacity={0.7}
                                >
                                    <ZoomIn color="white" size={20} />
                                </TouchableOpacity>
                            </View>

                            {/* Cancel Button */}
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={handleCancel}
                                activeOpacity={0.7}
                            >
                                <X color="white" size={18} />
                                <Text style={styles.cancelButtonText}>Annuler le scan</Text>
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>
                </View>
            )}

            {isProcessing && (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 100 }]}>
                    <ActivityIndicator size="large" color="#0d9488" />
                    <Text style={{ color: 'white', marginTop: 10, fontWeight: 'bold' }}>Validation en cours...</Text>
                </View>
            )}

            {showSuccess && (
                <Animated.View style={[styles.successOverlay, { opacity: fadeAnim }]}>
                    <View style={styles.successCard}>
                        <View style={styles.successIconCircle}>
                            <Text style={styles.successEmoji}>✅</Text>
                        </View>
                        <Text style={styles.successText}>Présence Enregistrée</Text>
                        <Text style={styles.successSubtext}>
                            {successMessage || "Votre passage a été validé avec succès."}
                        </Text>
                    </View>
                </Animated.View>
            )}

            {showCancelled && (
                <Animated.View style={[styles.successOverlay, { opacity: fadeAnim }]}>
                    <View style={styles.successCard}>
                        <View style={[styles.successIconCircle, { backgroundColor: '#fef2f2' }]}>
                            <Text style={styles.successEmoji}>❌</Text>
                        </View>
                        <Text style={[styles.successText, { color: '#ef4444' }]}>Scan Annulé</Text>
                        <Text style={styles.successSubtext}>La prise de présence a été interrompue.</Text>
                    </View>
                </Animated.View>
            )}
        </View>
    );
}

const overlayColor = 'rgba(0,0,0,0.7)';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    message: {
        textAlign: 'center',
        color: 'white',
        fontSize: 16,
        marginBottom: 20,
    },
    permissionButton: {
        backgroundColor: '#0d9488',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
    },
    permissionButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    uiLayer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
        zIndex: 20,
    },
    topBar: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    bottomControls: {
        alignItems: 'center',
        paddingBottom: 40,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlayContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
    },
    overlayTop: {
        flex: 1,
        backgroundColor: overlayColor,
    },
    overlayMiddle: {
        flexDirection: 'row',
        height: SCAN_SIZE,
    },
    overlaySide: {
        flex: 1,
        backgroundColor: overlayColor,
    },
    scanArea: {
        width: SCAN_SIZE,
        height: SCAN_SIZE,
    },
    overlayBottom: {
        flex: 1,
        backgroundColor: overlayColor,
        alignItems: 'center',
        paddingTop: 40,
    },
    instructionText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '600',
        textAlign: 'center',
    },
    corner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: '#0d9488',
        borderWidth: 4,
        borderRadius: 4,
    },
    topLeft: { top: 0, left: 0, borderBottomWidth: 0, borderRightWidth: 0 },
    topRight: { top: 0, right: 0, borderBottomWidth: 0, borderLeftWidth: 0 },
    bottomLeft: { bottom: 0, left: 0, borderTopWidth: 0, borderRightWidth: 0 },
    bottomRight: { bottom: 0, right: 0, borderTopWidth: 0, borderLeftWidth: 0 },
    scanLine: {
        position: 'absolute',
        width: '100%',
        height: 3,
        backgroundColor: '#0d9488',
        shadowColor: '#0d9488',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 5,
    },
    successOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
    },
    successCard: {
        alignItems: 'center',
    },
    successEmoji: {
        fontSize: 50,
    },
    successIconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#ecfdf5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    successText: {
        fontSize: 24,
        fontWeight: '900',
        color: '#059669',
        textAlign: 'center',
    },
    successSubtext: {
        fontSize: 16,
        color: '#64748b',
        marginTop: 8,
        textAlign: 'center',
    },
    guideLineH: {
        position: 'absolute',
        top: '50%',
        left: '10%',
        right: '10%',
        height: 1,
        backgroundColor: 'rgba(13, 148, 136, 0.2)',
    },
    guideLineV: {
        position: 'absolute',
        left: '50%',
        top: '10%',
        bottom: '10%',
        width: 1,
        backgroundColor: 'rgba(13, 148, 136, 0.2)',
    },
    zoomContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 25,
        marginTop: 20,
        width: '70%',
        gap: 15,
    },
    zoomButton: {
        padding: 5,
    },
    zoomTrack: {
        flex: 1,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    zoomFill: {
        height: '100%',
        backgroundColor: '#0d9488',
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 30,
        marginTop: 40,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.4)',
        gap: 8,
    },
    cancelButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
    }
});
