import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Image,
    ScrollView, Alert, ActivityIndicator, Modal, Dimensions
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Camera, Image as ImageIcon, CheckCircle, XCircle, AlertCircle, Trash2, User } from 'lucide-react-native';
import { apiFetch, BASE_URL } from '../services/api';

const { width } = Dimensions.get('window');

interface Props {
    navigation: any;
    currentPhotoUrl?: string | null;
    onPhotoUpdated?: (url: string | null) => void;
}

// ============================================================
// RÈGLES DE VALIDATION CÔTÉ MOBILE (avant upload)
// ============================================================
const PHOTO_RULES = [
    { id: 1, icon: '👤', label: 'Visage clairement visible', description: 'Votre visage doit occuper au moins la moitié de la photo' },
    { id: 2, icon: '💡', label: 'Bonne luminosité', description: 'Photo prise dans un endroit bien éclairé, sans contre-jour' },
    { id: 3, icon: '📐', label: 'Photo droite', description: 'Tenez le téléphone droit, ne penchez pas la tête' },
    { id: 4, icon: '🚫', label: 'Seul sur la photo', description: 'Personne d\'autre ne doit apparaître sur la photo' },
    { id: 5, icon: '😐', label: 'Expression neutre', description: 'Regardez directement la caméra avec une expression calme' },
    { id: 6, icon: '🎓', label: 'Photo professionnelle', description: 'Pas de filtre, de lunettes de soleil ou de chapeau' },
];

const BAD_EXAMPLES = [
    { emoji: '😎', label: 'Lunettes\nde soleil' },
    { emoji: '🤳', label: 'Selfie\ncoupé' },
    { emoji: '👥', label: 'Plusieurs\npersonnes' },
    { emoji: '🌑', label: 'Photo\nsombre' },
];

const GOOD_EXAMPLE = { emoji: '🧑', label: 'Visage centré,\nbien éclairé' };

export function ProfilePhotoScreen({ navigation, currentPhotoUrl, onPhotoUpdated }: Props) {
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [currentPhoto, setCurrentPhoto] = useState<string | null>(currentPhotoUrl || null);
    const [isUploading, setIsUploading] = useState(false);
    const [showGuide, setShowGuide] = useState(true);
    const [rejectionReasons, setRejectionReasons] = useState<string[]>([]);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    // ============================================================
    // VALIDATION LOCALE AVANT UPLOAD
    // ============================================================
    const validatePhotoLocally = async (uri: string): Promise<{ valid: boolean; reasons: string[] }> => {
        const reasons: string[] = [];

        // Vérifier les dimensions minimales
        await new Promise<void>((resolve) => {
            Image.getSize(uri, (w, h) => {
                if (w < 200 || h < 200) {
                    reasons.push('❌ Image trop petite (minimum 200x200 pixels)');
                }
                // Vérifier que c'est à peu près carré (portrait ou carré OK, mais pas trop paysage)
                const ratio = w / h;
                if (ratio > 2.5) {
                    reasons.push('❌ Image trop large — utilisez une photo portrait ou carrée');
                }
                resolve();
            }, () => resolve());
        });

        return { valid: reasons.length === 0, reasons };
    };

    // ============================================================
    // CHOISIR UNE PHOTO DEPUIS LA GALERIE
    // ============================================================
    const pickFromGallery = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission refusée', 'Autorisez l\'accès à la galerie pour continuer.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],   // Force le crop carré
            quality: 1,
        });

        if (!result.canceled && result.assets[0]) {
            await processSelectedPhoto(result.assets[0].uri);
        }
    };

    // ============================================================
    // PRENDRE UNE PHOTO AVEC L'APPAREIL PHOTO
    // ============================================================
    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission refusée', 'Autorisez l\'accès à la caméra pour continuer.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],    // Force le crop carré
            quality: 1,
            cameraType: ImagePicker.CameraType.front, // Caméra frontale par défaut
        });

        if (!result.canceled && result.assets[0]) {
            await processSelectedPhoto(result.assets[0].uri);
        }
    };

    // ============================================================
    // TRAITEMENT + COMPRESSION LOCALE
    // ============================================================
    const processSelectedPhoto = async (uri: string) => {
        try {
            setRejectionReasons([]);

            // Validation locale
            const { valid, reasons } = await validatePhotoLocally(uri);
            if (!valid) {
                setRejectionReasons(reasons);
                return;
            }

            // Compression locale avant envoi au serveur
            // Resize à 800x800 max + qualité 0.85 (Cloudinary compressera encore plus)
            const compressed = await ImageManipulator.manipulateAsync(
                uri,
                [{ resize: { width: 800, height: 800 } }],
                { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
            );

            setPhotoUri(compressed.uri);
            setShowGuide(false);
            setUploadSuccess(false);
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de traiter la photo. Réessayez.');
        }
    };

    // ============================================================
    // UPLOAD VERS LE SERVEUR
    // ============================================================
    const uploadPhoto = async () => {
        if (!photoUri) return;

        setIsUploading(true);
        setRejectionReasons([]);

        try {
            const formData = new FormData();
            formData.append('photo', {
                uri: photoUri,
                type: 'image/jpeg',
                name: 'profile_photo.jpg',
            } as any);

            // Récupérer le token JWT
            const { getAuthToken } = await import('../services/api');
            const token = await getAuthToken();

            const response = await fetch(`${BASE_URL}/users/profile-photo`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    // Ne PAS mettre Content-Type ici — fetch le fait automatiquement pour FormData
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                // Photo rejetée avec raisons
                if (data.rejectionReasons && data.rejectionReasons.length > 0) {
                    setRejectionReasons(data.rejectionReasons);
                } else {
                    throw new Error(data.message || 'Erreur lors de l\'upload');
                }
                return;
            }

            // Succès
            setCurrentPhoto(data.profilePhotoUrl);
            setPhotoUri(null);
            setUploadSuccess(true);
            onPhotoUpdated?.(data.profilePhotoUrl);

            Alert.alert('✅ Succès', 'Votre photo de profil a été mise à jour !');

        } catch (error: any) {
            Alert.alert('Erreur', error.message || 'Impossible d\'uploader la photo.');
        } finally {
            setIsUploading(false);
        }
    };

    // ============================================================
    // SUPPRIMER LA PHOTO
    // ============================================================
    const deletePhoto = () => {
        Alert.alert(
            'Supprimer la photo',
            'Êtes-vous sûr de vouloir supprimer votre photo de profil ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await apiFetch('/users/profile-photo', { method: 'DELETE' });
                            setCurrentPhoto(null);
                            setPhotoUri(null);
                            onPhotoUpdated?.(null);
                            Alert.alert('Photo supprimée');
                        } catch (error: any) {
                            Alert.alert('Erreur', error.message);
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft color="#1e293b" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Photo de profil</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

                {/* Avatar actuel */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarContainer}>
                        {(photoUri || currentPhoto) ? (
                            <Image
                                source={{ uri: photoUri || currentPhoto! }}
                                style={styles.avatarImage}
                            />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <User color="#94a3b8" size={60} />
                            </View>
                        )}
                        {uploadSuccess && (
                            <View style={styles.successBadge}>
                                <CheckCircle color="white" size={20} fill="#10b981" />
                            </View>
                        )}
                    </View>

                    {/* Boutons d'action */}
                    <View style={styles.actionButtons}>
                        <TouchableOpacity style={styles.actionBtn} onPress={takePhoto}>
                            <Camera color="white" size={20} />
                            <Text style={styles.actionBtnText}>Caméra</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary]} onPress={pickFromGallery}>
                            <ImageIcon color="#0d9488" size={20} />
                            <Text style={[styles.actionBtnText, { color: '#0d9488' }]}>Galerie</Text>
                        </TouchableOpacity>
                        {currentPhoto && !photoUri && (
                            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDanger]} onPress={deletePhoto}>
                                <Trash2 color="#ef4444" size={20} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Raisons de rejet */}
                {rejectionReasons.length > 0 && (
                    <View style={styles.rejectionBox}>
                        <View style={styles.rejectionHeader}>
                            <XCircle color="#ef4444" size={20} />
                            <Text style={styles.rejectionTitle}>Photo rejetée</Text>
                        </View>
                        {rejectionReasons.map((reason, i) => (
                            <Text key={i} style={styles.rejectionReason}>{reason}</Text>
                        ))}
                    </View>
                )}

                {/* Bouton Upload */}
                {photoUri && (
                    <TouchableOpacity
                        style={[styles.uploadButton, isUploading && { opacity: 0.7 }]}
                        onPress={uploadPhoto}
                        disabled={isUploading}
                    >
                        {isUploading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.uploadButtonText}>✅ Valider cette photo</Text>
                        )}
                    </TouchableOpacity>
                )}
                {photoUri && (
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => { setPhotoUri(null); setShowGuide(true); }}>
                        <Text style={styles.cancelBtnText}>Choisir une autre photo</Text>
                    </TouchableOpacity>
                )}

                {/* Guide des règles */}
                {showGuide && (
                    <View style={styles.guideSection}>
                        <Text style={styles.guideTitle}>📋 Guide — Photo de profil UNILU</Text>
                        <Text style={styles.guideSubtitle}>
                            Votre photo sera utilisée pour l'identification officielle. Elle doit respecter les règles suivantes :
                        </Text>

                        {/* Exemple bon vs mauvais */}
                        <View style={styles.examplesRow}>
                            <View style={styles.exampleBox}>
                                <Text style={styles.exampleTitle}>✅ Bon exemple</Text>
                                <View style={[styles.exampleCard, styles.goodCard]}>
                                    <Text style={styles.exampleEmoji}>{GOOD_EXAMPLE.emoji}</Text>
                                    <Text style={styles.exampleLabel}>{GOOD_EXAMPLE.label}</Text>
                                </View>
                            </View>
                            <View style={styles.exampleBox}>
                                <Text style={styles.exampleTitle}>❌ À éviter</Text>
                                <View style={styles.badExamplesGrid}>
                                    {BAD_EXAMPLES.map((ex, i) => (
                                        <View key={i} style={[styles.badCard]}>
                                            <Text style={styles.exampleEmoji}>{ex.emoji}</Text>
                                            <Text style={styles.badLabel}>{ex.label}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </View>

                        {/* Règles détaillées */}
                        <View style={styles.rulesList}>
                            {PHOTO_RULES.map((rule) => (
                                <View key={rule.id} style={styles.ruleItem}>
                                    <View style={styles.ruleIconBox}>
                                        <Text style={styles.ruleIcon}>{rule.icon}</Text>
                                    </View>
                                    <View style={styles.ruleText}>
                                        <Text style={styles.ruleLabel}>{rule.label}</Text>
                                        <Text style={styles.ruleDescription}>{rule.description}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>

                        {/* Note technique */}
                        <View style={styles.techNote}>
                            <AlertCircle color="#6366f1" size={14} />
                            <Text style={styles.techNoteText}>
                                Votre photo sera automatiquement compressée et redimensionnée à 400×400 pixels. Elle sera stockée de façon sécurisée sur nos serveurs.
                            </Text>
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    backButton: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
    content: { padding: 20, paddingBottom: 40 },

    // Avatar
    avatarSection: { alignItems: 'center', marginBottom: 24 },
    avatarContainer: { position: 'relative', marginBottom: 16 },
    avatarImage: { width: 140, height: 140, borderRadius: 70, borderWidth: 3, borderColor: '#0d9488' },
    avatarPlaceholder: {
        width: 140, height: 140, borderRadius: 70,
        backgroundColor: '#f1f5f9', borderWidth: 2,
        borderColor: '#e2e8f0', borderStyle: 'dashed',
        justifyContent: 'center', alignItems: 'center'
    },
    successBadge: {
        position: 'absolute', bottom: 4, right: 4,
        backgroundColor: 'white', borderRadius: 12, padding: 2
    },
    actionButtons: { flexDirection: 'row', gap: 10 },
    actionBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#0d9488', paddingHorizontal: 18,
        paddingVertical: 10, borderRadius: 25
    },
    actionBtnSecondary: {
        backgroundColor: 'white', borderWidth: 1.5, borderColor: '#0d9488'
    },
    actionBtnDanger: {
        backgroundColor: 'white', borderWidth: 1.5, borderColor: '#fca5a5',
        paddingHorizontal: 12
    },
    actionBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },

    // Rejet
    rejectionBox: {
        backgroundColor: '#fef2f2', borderRadius: 12, padding: 16,
        borderWidth: 1, borderColor: '#fca5a5', marginBottom: 16
    },
    rejectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    rejectionTitle: { fontSize: 15, fontWeight: '800', color: '#dc2626' },
    rejectionReason: { fontSize: 13, color: '#b91c1c', marginTop: 4, lineHeight: 20 },

    // Upload
    uploadButton: {
        backgroundColor: '#0d9488', borderRadius: 16,
        paddingVertical: 15, alignItems: 'center', marginBottom: 10
    },
    uploadButtonText: { color: 'white', fontSize: 16, fontWeight: '800' },
    cancelBtn: { alignItems: 'center', paddingVertical: 10, marginBottom: 10 },
    cancelBtnText: { color: '#64748b', fontSize: 14 },

    // Guide
    guideSection: { backgroundColor: 'white', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    guideTitle: { fontSize: 17, fontWeight: '800', color: '#1e293b', marginBottom: 8 },
    guideSubtitle: { fontSize: 13, color: '#64748b', lineHeight: 20, marginBottom: 20 },

    // Exemples
    examplesRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    exampleBox: { flex: 1 },
    exampleTitle: { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 8, textAlign: 'center' },
    exampleCard: {
        borderRadius: 12, padding: 12, alignItems: 'center',
        borderWidth: 2, borderColor: '#86efac', backgroundColor: '#f0fdf4'
    },
    goodCard: { borderColor: '#86efac', backgroundColor: '#f0fdf4' },
    exampleEmoji: { fontSize: 36, marginBottom: 4 },
    exampleLabel: { fontSize: 11, color: '#166534', textAlign: 'center', fontWeight: '600' },
    badExamplesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    badCard: {
        width: '47%', borderRadius: 10, padding: 8, alignItems: 'center',
        borderWidth: 1.5, borderColor: '#fca5a5', backgroundColor: '#fff5f5'
    },
    badLabel: { fontSize: 9, color: '#991b1b', textAlign: 'center', fontWeight: '600', lineHeight: 12 },

    // Règles
    rulesList: { gap: 12, marginBottom: 16 },
    ruleItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    ruleIconBox: {
        width: 40, height: 40, borderRadius: 10,
        backgroundColor: '#f0fdfa', justifyContent: 'center', alignItems: 'center'
    },
    ruleIcon: { fontSize: 20 },
    ruleText: { flex: 1 },
    ruleLabel: { fontSize: 14, fontWeight: '700', color: '#1e293b', marginBottom: 2 },
    ruleDescription: { fontSize: 12, color: '#64748b', lineHeight: 18 },

    // Note technique
    techNote: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 8,
        backgroundColor: '#eef2ff', borderRadius: 10, padding: 12
    },
    techNoteText: { flex: 1, fontSize: 11, color: '#4338ca', lineHeight: 16 }
});
