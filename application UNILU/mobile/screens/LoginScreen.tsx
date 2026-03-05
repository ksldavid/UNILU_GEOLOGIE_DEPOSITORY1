import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Image, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Animated, Keyboard, Modal, ScrollView } from 'react-native';
import { Mail, Phone, User, BookOpen, Fingerprint, MessageSquare, Send, X, ChevronRight, Eye, EyeOff } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/auth';

interface LoginScreenProps {
    onLogin: () => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
    const [id, setId] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const fadeAnim = React.useRef(new Animated.Value(0)).current;

    const [failedAttempts, setFailedAttempts] = useState(0);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedTheme, setSelectedTheme] = useState('Assistance technique');
    const [message, setMessage] = useState('');
    const [studentName, setStudentName] = useState('');
    const [studentClass, setStudentClass] = useState('');
    const [studentId, setStudentId] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [isSending, setIsSending] = useState(false);

    const themes = [
        'Assistance technique',
        'Problème d\'ID/Badge',
        'Réclamation Notes',
        'Demande d\'information',
        'Autre'
    ];

    const handleSendMessage = async () => {
        if (!message || !studentName || !studentId) {
            Alert.alert("Erreur", "Veuillez remplir les informations obligatoires (Nom, ID et Message).");
            return;
        }

        setIsSending(true);
        try {
            const { apiFetch } = require('../services/api');
            await apiFetch('/support/public-tickets', {
                method: 'POST',
                body: JSON.stringify({
                    subject: selectedTheme,
                    category: 'Technique',
                    message,
                    studentName,
                    studentId,
                    studentClass,
                    whatsapp
                }),
            });

            setIsSending(false);
            setIsModalVisible(false);
            Alert.alert("Succès", "Votre message a été envoyé à l'administration. Nous vous contacterons sous peu.");

            // Reset form
            setMessage('');
            setStudentName('');
            setStudentClass('');
            setStudentId('');
            setWhatsapp('');
        } catch (error: any) {
            setIsSending(false);
            Alert.alert("Erreur", error.message || "Impossible d'envoyer le message. Vérifiez votre connexion.");
        }
    };

    const handleLogin = async () => {
        // Rétracter le clavier
        Keyboard.dismiss();

        if (!id || !password) {
            Alert.alert("Erreur", "Veuillez remplir tous les champs.");
            return;
        }

        setIsLoading(true);
        try {
            // Utilisation du vrai service d'authentification
            await authService.login(id, password);

            setIsLoading(false);
            setShowSuccess(true);

            // Lancer l'animation d'apparition du message de succès
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }).start();

            // Attendre 2 secondes pour montrer le succès avant de changer de page
            setTimeout(() => {
                onLogin();
            }, 2000);
        } catch (error: any) {
            setIsLoading(false);
            const newFailedAttempts = failedAttempts + 1;
            setFailedAttempts(newFailedAttempts);

            if (newFailedAttempts >= 5) {
                Alert.alert(
                    "Compte bloqué",
                    "Vous avez échoué 5 fois. Veuillez contacter l'administration pour débloquer votre accès.",
                    [{ text: "OK" }]
                );
            } else {
                Alert.alert(
                    "Connexion échouée",
                    error.message || "Identifiant ou mot de passe incorrect.",
                    [{ text: "Réessayer" }]
                );
            }
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.content}>
                    <Text style={styles.universityTitle}>UNIVERSITÉ DE LUBUMBASHI</Text>
                    <Text style={styles.universitySubtitle}>Portail universitaire étudiant</Text>
                    <Image
                        source={require('../assets/unilu-logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>ID étudiant</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Entrez votre ID"
                            placeholderTextColor="#94a3b8"
                            value={id}
                            onChangeText={setId}
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Mot de passe</Text>
                        <View style={styles.passwordWrapper}>
                            <TextInput
                                style={[styles.input, { flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRightWidth: 0 }]}
                                placeholder="Entrez votre mot de passe"
                                placeholderTextColor="#94a3b8"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity
                                style={styles.eyeButton}
                                onPress={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={20} color="#64748b" /> : <Eye size={20} color="#64748b" />}
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                        onPress={handleLogin}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.loginButtonText}>Se connecter</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Vous rencontrez un problème ? </Text>
                        <TouchableOpacity onPress={() => setIsModalVisible(true)}>
                            <Text style={styles.footerLink}>contacter l'administrateur</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* Modal de contact */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.modalContent}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Contacter l'Admin</Text>
                            <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.closeButton}>
                                <X size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
                            <Text style={styles.sectionLabel}>Thème du message</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.themesContainer}>
                                {themes.map((theme) => (
                                    <TouchableOpacity
                                        key={theme}
                                        style={[
                                            styles.themeChip,
                                            selectedTheme === theme && styles.themeChipSelected
                                        ]}
                                        onPress={() => setSelectedTheme(theme)}
                                    >
                                        <Text style={[
                                            styles.themeChipText,
                                            selectedTheme === theme && styles.themeChipTextSelected
                                        ]}>
                                            {theme}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <Text style={styles.sectionLabel}>Détails de votre problème</Text>
                            <View style={styles.messageInputContainer}>
                                <MessageSquare size={20} color="#94a3b8" style={styles.fieldIcon} />
                                <TextInput
                                    style={styles.textArea}
                                    placeholder="Décrivez votre situation en détail..."
                                    multiline={true}
                                    numberOfLines={4}
                                    value={message}
                                    onChangeText={setMessage}
                                    textAlignVertical="top"
                                />
                            </View>

                            <Text style={styles.sectionLabel}>Vos informations</Text>

                            <View style={styles.infoField}>
                                <User size={18} color="#94a3b8" style={styles.fieldIcon} />
                                <TextInput
                                    style={styles.fieldInput}
                                    placeholder="Nom complet"
                                    value={studentName}
                                    onChangeText={setStudentName}
                                />
                            </View>

                            <View style={styles.infoField}>
                                <Fingerprint size={18} color="#94a3b8" style={styles.fieldIcon} />
                                <TextInput
                                    style={styles.fieldInput}
                                    placeholder="ID Étudiant"
                                    value={studentId}
                                    onChangeText={setStudentId}
                                />
                            </View>

                            <View style={styles.infoField}>
                                <BookOpen size={18} color="#94a3b8" style={styles.fieldIcon} />
                                <TextInput
                                    style={styles.fieldInput}
                                    placeholder="Promotion / Classe (ex: L2 Géo)"
                                    value={studentClass}
                                    onChangeText={setStudentClass}
                                />
                            </View>

                            <View style={styles.infoField}>
                                <Phone size={18} color="#94a3b8" style={styles.fieldIcon} />
                                <TextInput
                                    style={styles.fieldInput}
                                    placeholder="Numéro WhatsApp"
                                    keyboardType="phone-pad"
                                    value={whatsapp}
                                    onChangeText={setWhatsapp}
                                />
                            </View>

                            <TouchableOpacity
                                style={styles.sendButton}
                                onPress={handleSendMessage}
                                disabled={isSending}
                            >
                                <LinearGradient
                                    colors={['#0d9488', '#0f766e']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.sendButtonGradient}
                                >
                                    {isSending ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <>
                                            <Text style={styles.sendButtonText}>Envoyer le message</Text>
                                            <Send size={20} color="white" style={{ marginLeft: 8 }} />
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
            {showSuccess && (
                <Animated.View style={[styles.successOverlay, { opacity: fadeAnim }]}>
                    <View style={styles.successCard}>
                        <Text style={styles.successEmoji}>🎊</Text>
                        <Text style={styles.successText}>Connexion réussie !</Text>
                    </View>
                </Animated.View>
            )}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    universityTitle: {
        fontSize: 26,
        fontWeight: '900',
        color: '#1e3a8a',
        textAlign: 'center',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    universitySubtitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 30,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 30,
        paddingTop: 40,
        paddingBottom: 20,
    },
    logo: {
        width: 300,
        height: 300,
        marginBottom: 40,
    },
    inputContainer: {
        width: '100%',
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        width: '100%',
        height: 50,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 15,
        backgroundColor: '#f9f9f9',
        color: '#000000',
    },
    passwordWrapper: {
        flexDirection: 'row',
        width: '100%',
    },
    eyeButton: {
        height: 50,
        width: 50,
        borderWidth: 1,
        borderColor: '#ddd',
        borderLeftWidth: 0,
        borderTopRightRadius: 8,
        borderBottomRightRadius: 8,
        backgroundColor: '#f9f9f9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loginButton: {
        width: '100%',
        backgroundColor: '#0d9488',
        height: 56,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        shadowColor: '#0d9488',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    loginButtonDisabled: {
        opacity: 0.7,
    },
    loginButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginTop: 40,
        paddingBottom: 20,
    },
    footerText: {
        fontSize: 13,
        color: '#666',
    },
    footerLink: {
        fontSize: 13,
        color: '#0d9488',
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
    successOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    successCard: {
        backgroundColor: 'white',
        padding: 40,
        borderRadius: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    successEmoji: {
        fontSize: 60,
        marginBottom: 20,
    },
    successText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#0d9488',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        height: '85%',
        paddingTop: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalScroll: {
        padding: 24,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
        marginBottom: 12,
        marginTop: 8,
    },
    themesContainer: {
        marginBottom: 20,
    },
    themeChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginRight: 10,
    },
    themeChipSelected: {
        backgroundColor: '#f0fdfa',
        borderColor: '#0d9488',
    },
    themeChipText: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '500',
    },
    themeChipTextSelected: {
        color: '#0d9488',
        fontWeight: '600',
    },
    messageInputContainer: {
        flexDirection: 'row',
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        padding: 12,
        marginBottom: 20,
    },
    textArea: {
        flex: 1,
        height: 100,
        fontSize: 15,
        color: '#000000',
        paddingLeft: 10,
    },
    infoField: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        paddingHorizontal: 15,
        height: 54,
        marginBottom: 12,
    },
    fieldIcon: {
        marginRight: 0,
    },
    fieldInput: {
        flex: 1,
        height: '100%',
        fontSize: 15,
        color: '#000000',
        paddingLeft: 10,
    },
    sendButton: {
        marginTop: 10,
        marginBottom: 40,
        borderRadius: 16,
        overflow: 'hidden',
    },
    sendButtonGradient: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
