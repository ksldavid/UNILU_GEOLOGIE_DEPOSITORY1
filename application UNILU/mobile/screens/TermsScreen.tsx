import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { Camera, MapPin, CheckCircle2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TermsScreenProps {
    onAccept: () => void;
}

export const TermsScreen: React.FC<TermsScreenProps> = ({ onAccept }) => {
    const [cameraPermission, requestCameraPermission] = useCameraPermissions();
    const [locationPermission, requestLocationPermission] = Location.useForegroundPermissions();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleAccept = async () => {
        setIsProcessing(true);
        try {
            // Directement demander les permissions
            const camStatus = await requestCameraPermission();
            const locStatus = await requestLocationPermission();

            if (!camStatus.granted || !locStatus.granted) {
                Alert.alert(
                    "Permissions nécessaires",
                    "Pour utiliser l'application UNILU, vous devez accepter l'accès à la caméra (pour le scan) et à la localisation.",
                    [{ text: "OK" }]
                );
                setIsProcessing(false);
                return;
            }

            // Sauvegarder que les termes ont été acceptés
            await AsyncStorage.setItem('hasAcceptedTerms', 'true');
            onAccept();
        } catch (error) {
            console.error(error);
            Alert.alert("Erreur", "Une erreur est survenue lors de l'enregistrement.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#E0F2FE', '#FFFFFF']} style={styles.header}>
                <Image
                    source={require('../assets/unilu-logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <Text style={styles.title}>Termes et Conditions</Text>
                <Text style={styles.subtitle}>Sécurité et Confidentialité</Text>
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>1. Utilisation de l'App</Text>
                    <Text style={styles.text}>
                        L'application UNILU est destinée exclusivement aux étudiants. Elle est utilisée pour la prise de présence et l'accès aux ressources académiques.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>2. Données et Permissions</Text>
                    <View style={styles.permissionItem}>
                        <Camera size={20} color="#0d9488" style={styles.icon} />
                        <Text style={styles.text}>Accès à la caméra pour scanner les codes QR de présence.</Text>
                    </View>
                    <View style={styles.permissionItem}>
                        <MapPin size={20} color="#0d9488" style={styles.icon} />
                        <Text style={styles.text}>Accès à la localisation pour certifier votre présence en classe.</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>3. Responsabilité</Text>
                    <Text style={styles.text}>
                        L'étudiant est responsable de la confidentialité de ses identifiants. Toute fraude détectée entraînera des sanctions disciplinaires.
                    </Text>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.button, isProcessing && styles.buttonDisabled]}
                    onPress={handleAccept}
                    disabled={isProcessing}
                >
                    <LinearGradient
                        colors={['#1e3a8a', '#3b82f6']}
                        style={styles.buttonGradient}
                    >
                        {isProcessing ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.buttonText}>J'accepte et je continue</Text>
                                <CheckCircle2 size={20} color="#fff" style={{ marginLeft: 8 }} />
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 30,
        alignItems: 'center',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    logo: {
        width: 100,
        height: 100,
        marginBottom: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e3a8a',
        marginTop: 15,
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 5,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    section: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e3a8a',
        marginBottom: 10,
    },
    text: {
        fontSize: 15,
        color: '#475569',
        lineHeight: 22,
        flex: 1,
    },
    permissionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        backgroundColor: '#f8fafc',
        padding: 12,
        borderRadius: 12,
    },
    icon: {
        marginRight: 12,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    button: {
        height: 56,
        borderRadius: 16,
        overflow: 'hidden',
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
