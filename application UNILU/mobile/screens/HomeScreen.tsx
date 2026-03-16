import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, SafeAreaView, StatusBar, ScrollView, Dimensions, Platform, RefreshControl, ActivityIndicator, Modal, FlatList, BackHandler, ToastAndroid } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Animated } from 'react-native';
import { QrCode, Search, LogOut, Bell, ChevronRight, ArrowLeft, BookOpen, Wifi, WifiOff, Calendar, GraduationCap, User as UserIcon, Home, CheckCircle, ExternalLink, ArrowRight, ImagePlus, Megaphone, Trash2, Send, Plus, AlertCircle, Camera } from 'lucide-react-native';
import { Linking, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { attendanceService, refreshOfflineToken } from '../services/attendance';
import { studentService } from '../services/student';
import { notificationService } from '../services/notification';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { GlobalAttendanceScreen } from './GlobalAttendanceScreen';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
        // Vibration and sound are handled by the OS if these are true
    }),
});

const { width, height } = Dimensions.get('window');

interface Notification {
    id: string;
    title: string;
    content: string;
    description?: string; // Fallback
    date: string;
    author?: string;
    type: 'course' | 'grade' | 'reminder' | 'cancel' | 'SCHEDULE' | 'RESOURCE';
    color: string;
    courseId?: string;
}

const DUMMY_SCHEDULE: any[] = [];

interface AttendanceHistory {
    id: string;
    courseName: string;
    courseId: string;
    date: string;
    time: string;
    status: 'present' | 'late' | 'absent' | 'excused' | 'pending';
}

interface CourseStats {
    id: string;
    code?: string;
    name: string;
    percentage: number;
    color: string;
    professor?: string;
    room?: string;
    schedule?: string;
    materials?: number;
    assignments?: number;
    attendedCount?: number;
    totalCount?: number;
    nextSession?: string;
    status?: 'ACTIVE' | 'FINISHED';
    courseProgress?: number;
    isComplement?: boolean;
    isCompleted?: boolean;
}

const getAttendanceColor = (percentage: number) => {
    if (percentage >= 70) return '#10b981'; // Vert
    if (percentage >= 40) return '#f59e0b'; // Jaune
    return '#ef4444'; // Rouge
};

interface HomeScreenProps {
    onLogout: () => void;
    onOpenScanner: () => void;
    onOpenProfilePhoto: (currentUrl: string | null) => void;
    overridePhotoUrl?: string | null;  // URL de photo mise à jour sans re-fetch
}

export function HomeScreen({ onLogout, onOpenScanner, onOpenProfilePhoto, overridePhotoUrl }: HomeScreenProps) {
    const insets = useSafeAreaInsets();
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [offlineScansCount, setOfflineScansCount] = useState(0);
    const [searchText, setSearchText] = useState('');
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
    const [selectedCourse, setSelectedCourse] = useState<CourseStats | null>(null);
    const [showFullStats, setShowFullStats] = useState(false);
    const [showFullHistory, setShowFullHistory] = useState(false);
    const [showFullAnnouncements, setShowFullAnnouncements] = useState(false);

    // Ad Management States
    const [isAdAdminVisible, setIsAdAdminVisible] = useState(false);
    const [adminAds, setAdminAds] = useState<any[]>([]);
    const [isCreatingAd, setIsCreatingAd] = useState(false);
    const [newAdForm, setNewAdForm] = useState({
        title: '',
        linkUrl: '',
        dailyLimit: '1',
        pushTitle: '',
        pushBody: ''
    });
    const [selectedAdImage, setSelectedAdImage] = useState<string | null>(null);
    const [isSubmittingAd, setIsSubmittingAd] = useState(false);
    const adAdminAnim = useRef(new Animated.Value(0)).current;

    const [refreshing, setRefreshing] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [activeTab, setActiveTab] = useState('home');
    const [isConnected, setIsConnected] = useState(true);
    const [showGlobalAttendance, setShowGlobalAttendance] = useState(false);
    const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());
    const [offlineScans, setOfflineScans] = useState<any[]>([]);
    const [coursesData, setCoursesData] = useState<any[]>([]);
    const [scheduleData, setScheduleData] = useState<any>(null);
    const [examsData, setExamsData] = useState<any[]>([]);
    const [profileData, setProfileData] = useState<any>(null);
    const [ads, setAds] = useState<any[]>([]);
    const [currentAdIndex, setCurrentAdIndex] = useState(0);
    const adScrollRef = useRef<FlatList>(null);

    const handleAdScroll = useCallback((event: any) => {
        const scrollOffset = event.nativeEvent.contentOffset.x;
        const index = Math.round(scrollOffset / width);
        if (index !== currentAdIndex && index >= 0 && index < ads.length) {
            setCurrentAdIndex(index);
        }
    }, [currentAdIndex, ads.length]);


    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editSex, setEditSex] = useState('');
    const [editBirthday, setEditBirthday] = useState('');
    const [editNationality, setEditNationality] = useState('');
    const [editWhatsapp, setEditWhatsapp] = useState('');
    const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);

    const [isUnenrolling, setIsUnenrolling] = useState(false);
    const [unenrollPassword, setUnenrollPassword] = useState('');
    const [showUnenrollAuth, setShowUnenrollAuth] = useState(false);
    const [availableCourses, setAvailableCourses] = useState<any[]>([]);
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
    const [isLoadingAvailable, setIsLoadingAvailable] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const courseDetailAnim = useRef(new Animated.Value(0)).current;
    const fullStatsAnim = useRef(new Animated.Value(0)).current;
    const fullHistoryAnim = useRef(new Animated.Value(0)).current;
    const fullAnnouncementsAnim = useRef(new Animated.Value(0)).current;
    const scrollY = useRef(new Animated.Value(0)).current;
    const lastBackPressed = useRef<number>(0);

    const fetchAdminAds = async () => {
        try {
            const data = await studentService.getAllAds();
            setAdminAds(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
        }
    };

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission requise', 'Nous avons besoin de votre permission pour accéder à vos photos.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
        });

        if (!result.canceled) {
            setSelectedAdImage(result.assets[0].uri);
        }
    };

    const handleCreateAd = async () => {
        if (!selectedAdImage || !newAdForm.title || !newAdForm.linkUrl) {
            Alert.alert("Erreur", "Veuillez remplir le titre, le lien et choisir une image.");
            return;
        }

        setIsSubmittingAd(true);
        try {
            const formData = new FormData();
            formData.append('title', newAdForm.title);
            formData.append('linkUrl', newAdForm.linkUrl);
            formData.append('dailyLimit', newAdForm.dailyLimit);
            formData.append('pushTitle', newAdForm.pushTitle);
            formData.append('pushBody', newAdForm.pushBody);

            // Handle the image file
            const uriParts = selectedAdImage.split('.');
            const fileType = uriParts[uriParts.length - 1];

            formData.append('image', {
                uri: selectedAdImage,
                name: `ad_${Date.now()}.${fileType}`,
                type: `image/${fileType}`,
            } as any);

            await studentService.createAd(formData);
            Alert.alert("Succès", "Publicité créée avec succès !");
            setIsCreatingAd(false);
            setNewAdForm({ title: '', linkUrl: '', dailyLimit: '1', pushTitle: '', pushBody: '' });
            setSelectedAdImage(null);
            fetchAdminAds();
            fetchDashboardData(); // Refresh current ads
        } catch (error) {
            console.error(error);
            Alert.alert("Erreur", "Impossible de créer la publicité.");
        } finally {
            setIsSubmittingAd(false);
        }
    };

    const handleDeleteAd = async (id: string) => {
        Alert.alert(
            "Confirmation",
            "Voulez-vous vraiment supprimer cette publicité ?",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Supprimer",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await studentService.deleteAd(id);
                            fetchAdminAds();
                            fetchDashboardData();
                        } catch (error) {
                            Alert.alert("Erreur", "Impossible de supprimer la publicité.");
                        }
                    }
                }
            ]
        );
    };

    const handleTriggerNotify = async (id: string) => {
        try {
            const res = await studentService.triggerAdNotify(id);
            Alert.alert("Succès", res.message || "Notifications envoyées !");
            fetchAdminAds();
        } catch (error: any) {
            Alert.alert("Erreur", error.message || "Erreur lors de l'envoi.");
        }
    };

    const openAdAdmin = () => {
        setIsAdAdminVisible(true);
        fetchAdminAds();
        Animated.spring(adAdminAnim, {
            toValue: 1,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
        }).start();
    };

    const closeAdAdmin = () => {
        Animated.timing(adAdminAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => setIsAdAdminVisible(false));
    };

    const unreadCount = (dashboardData?.announcements || []).filter(
        (notif: any) => !readNotifications.has(notif.id)
    ).length;

    const fetchDashboardData = useCallback(async () => {
        setIsLoadingData(true);
        try {
            // Fetch everything in parallel (sans les examens pour éviter un blocage en cas de route absente)
            const [dashboard, courses, schedule, profile, adsData] = await Promise.all([
                studentService.getDashboard(),
                studentService.getCourses(),
                studentService.getSchedule(),
                studentService.getProfile(),
                studentService.getAds()
            ]);

            setDashboardData(dashboard);
            setCoursesData(courses.courses || []);
            setScheduleData(schedule);
            setProfileData(profile);
            setAds(Array.isArray(adsData) ? adsData : []);
            setEditName(profile.name || '');
            setEditEmail(profile.email || '');
            setEditSex(profile.sex || '');
            if (profile.birthday) {
                setEditBirthday(new Date(profile.birthday).toISOString().split('T')[0]);
            }
            setEditNationality(profile.nationality || '');
            setEditWhatsapp(profile.whatsapp || '');

            // Charger les examens séparément (la route peut ne pas encore être déployée)
            try {
                const exams = await studentService.getExams();
                setExamsData(Array.isArray(exams) ? exams : []);
            } catch {
                // Route pas encore déployée sur le serveur, on ignore l'erreur silencieusement
                setExamsData([]);
            }

            // Vérifier aussi les scans hors-ligne en attente
            const existing = await AsyncStorage.getItem('offline_scans');
            const scans = existing ? JSON.parse(existing) : [];
            setOfflineScans(scans);
            setOfflineScansCount(scans.length);
            setIsConnected(true);
        } catch (error: any) {
            // Ne pas afficher de boîte rouge pour les erreurs d'auth
            const isAuthError = error?.message?.includes('Token invalide') || error?.message?.includes('expiré');

            if (isAuthError) {
                console.log("Session expirée, déconnexion requise.");
                Alert.alert("Session expirée", "Votre session n'est plus valide. Veuillez vous reconnecter.", [
                    { text: "OK", onPress: () => onLogout() }
                ]);
            } else {
                console.error("Erreur chargement données", error);
                setIsConnected(false);
            }
        } finally {
            setIsLoadingData(false);
        }
    }, []);

    useEffect(() => {
        scrollY.setValue(0);
    }, [activeTab]);

    useEffect(() => {
        notificationService.init();

        // 1. Synchroniser les scans ET rafraîchir le token de sécurité
        Promise.all([
            attendanceService.syncOfflineScans(),
            refreshOfflineToken()
        ]).then(([synced]) => {
            if (synced && synced > 0) {
                Alert.alert("Synchronisation", `${synced} présence(s) hors-ligne ont été synchronisées.`);
            }
            // 2. Charger les données ensuite
            fetchDashboardData();
        });

        return () => { };
    }, []);

    // Gérer le bouton retour Android pour fermer les fenêtres/modals
    useEffect(() => {
        const backAction = () => {
            // 1. Fermer les fenêtres d'abord
            if (selectedNotification) {
                closeNotification();
                return true;
            }
            if (selectedCourse) {
                closeCourseDetails();
                return true;
            }
            if (showFullStats) {
                closeFullStats();
                return true;
            }
            if (showFullHistory) {
                closeFullHistory();
                return true;
            }
            if (showFullAnnouncements) {
                closeFullAnnouncements();
                return true;
            }
            if (isAdAdminVisible) {
                closeAdAdmin();
                return true;
            }

            // 2. Si on est sur un onglet autre que l'accueil, revenir à l'accueil
            if (activeTab !== 'home') {
                setActiveTab('home');
                return true;
            }

            // 3. Double appui pour quitter à partir de l'accueil
            const currentTime = Date.now();
            if (lastBackPressed.current && currentTime - lastBackPressed.current < 2000) {
                return false; // Quitter l'app
            }

            lastBackPressed.current = currentTime;
            if (Platform.OS === 'android') {
                ToastAndroid.show('Appuyez à nouveau pour quitter', ToastAndroid.SHORT);
            }
            return true; // Empêcher la fermeture immédiate
        };

        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            backAction
        );

        return () => backHandler.remove();
    }, [selectedNotification, selectedCourse, showFullStats, showFullHistory, showFullAnnouncements, isAdAdminVisible, activeTab]);

    useEffect(() => {
        const lowerSearch = searchText.toLowerCase().trim();
        if (lowerSearch === 'davidksl') {
            triggerTestNotification();
            setSearchText(''); // Optionnel: vider la barre après déclenchement
        }
    }, [searchText]);

    const triggerTestNotification = async () => {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "📣 Annonce du Professeur",
                body: "Le professeur a publié une nouvelle annonce concernant le projet final. Veuillez consulter la section Documents.",
                data: { data: 'goes here' },
                sound: true,
            },
            trigger: null, // Instant
        });
    };

    const openNotification = (notif: Notification) => {
        setSelectedNotification(notif);
        setReadNotifications(prev => new Set(prev).add(notif.id));
        Animated.spring(fadeAnim, {
            toValue: 1,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
        }).start();
    };

    const markAllAsRead = () => {
        const allIds = (dashboardData?.announcements || []).map((n: any) => n.id);
        setReadNotifications(new Set(allIds));
    };

    const headerHeight = scrollY.interpolate({
        inputRange: [0, 120],
        outputRange: [Platform.OS === 'ios' ? 210 : 190, 0],
        extrapolate: 'clamp',
    });

    const headerTextOpacity = scrollY.interpolate({
        inputRange: [0, 60],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });

    const closeNotification = () => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => setSelectedNotification(null));
    };

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        // Garantir un délai minimum pour que l'animation soit bien visible
        const minDelay = new Promise(resolve => setTimeout(resolve, 1500));

        try {
            // 1. Synchroniser les scans hors-ligne
            const synced = await attendanceService.syncOfflineScans();

            // 2. Recharger les données
            await fetchDashboardData();

            // 3. Attendre la fin du délai minimum
            await minDelay;

            if (synced && synced > 0) {
                Alert.alert("Synchronisation", `${synced} présence(s) ont été synchronisées.`);
            }
        } catch (error) {
            console.error("Sync error", error);
        } finally {
            setRefreshing(false);
        }
    }, [fetchDashboardData]);

    const openCourseDetails = (course: CourseStats) => {
        setSelectedCourse(course);
        Animated.spring(courseDetailAnim, {
            toValue: 1,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
        }).start();
    };

    const closeCourseDetails = () => {
        Animated.timing(courseDetailAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            setSelectedCourse(null);
            setIsUnenrolling(false);
            setShowUnenrollAuth(false);
            setUnenrollPassword('');
        });
    };

    const handleUnenroll = async () => {
        if (!selectedCourse || !unenrollPassword) return;

        setIsEnrolling(true);
        try {
            const response = await studentService.unenrollFromCourse(selectedCourse.id, unenrollPassword);
            Alert.alert("Succès", response.message || "Désinscription réussie.");
            closeCourseDetails();
            fetchDashboardData();
        } catch (error: any) {
            Alert.alert("Erreur", error.message || "Impossible de se désinscrire.");
        } finally {
            setIsEnrolling(false);
        }
    };

    const fetchAvailableCourses = async () => {
        setIsLoadingAvailable(true);
        try {
            const data = await studentService.getAvailableCourses();
            setAvailableCourses(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoadingAvailable(false);
        }
    };

    const handleEnroll = async (courseCode: string) => {
        setIsEnrolling(true);
        try {
            const response = await studentService.enrollInCourse(courseCode);
            Alert.alert("Succès", response.message || "Inscription réussie !");
            setShowEnrollmentModal(false);
            fetchDashboardData();
        } catch (error: any) {
            Alert.alert("Erreur", error.message || "Échec de l'inscription.");
        } finally {
            setIsEnrolling(false);
        }
    };

    const openFullStats = () => {
        setShowFullStats(true);
        Animated.timing(fullStatsAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    const closeFullStats = () => {
        Animated.timing(fullStatsAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => setShowFullStats(false));
    };

    const openFullHistory = () => {
        setShowFullHistory(true);
        Animated.timing(fullHistoryAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    const closeFullHistory = () => {
        Animated.timing(fullHistoryAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => setShowFullHistory(false));
    };

    const openFullAnnouncements = () => {
        setShowFullAnnouncements(true);
        Animated.timing(fullAnnouncementsAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    const closeFullAnnouncements = () => {
        Animated.timing(fullAnnouncementsAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => setShowFullAnnouncements(false));
    };

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'present': return { label: 'Présent', color: '#10b981', bgColor: '#ecfdf5', points: '1/1' };
            case 'late': return { label: 'En retard', color: '#f59e0b', bgColor: '#fffbe6', points: '0.5/1' };
            case 'absent': return { label: 'Absent', color: '#ef4444', bgColor: '#fef2f2', points: '0/1' };
            case 'excused': return { label: 'Excusé', color: '#6366f1', bgColor: '#eef2ff', points: '1/1' };
            case 'pending': return { label: 'Sync. en attente', color: '#64748b', bgColor: '#f1f5f9', points: '-/-' };
            default: return { label: 'Inconnu', color: '#94a3b8', bgColor: '#f8fafc', points: '0/1' };
        }
    };

    const Skeleton = ({ width, height, borderRadius = 8, style = {} }: any) => {
        const animatedValue = useRef(new Animated.Value(0)).current;

        useEffect(() => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(animatedValue, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(animatedValue, {
                        toValue: 0,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }, []);

        const opacity = animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 0.7],
        });

        return (
            <Animated.View
                style={[
                    {
                        width,
                        height,
                        backgroundColor: '#e2e8f0',
                        borderRadius,
                        opacity,
                    },
                    style,
                ]}
            />
        );
    };

    const renderEmptyState = (message: string) => (
        <View style={styles.emptyStateContainer}>
            <View style={styles.emptyStateIcon}>
                <BookOpen size={40} color="#cbd5e1" />
            </View>
            <Text style={styles.emptyStateText}>{message}</Text>
        </View>
    );


    const renderHomeContent = () => {
        if (activeTab !== 'home') return null;
        return (
            <Animated.ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#0d9488"
                        colors={["#0d9488"]}
                        progressViewOffset={Platform.OS === 'ios' ? 0 : 120}
                    />
                }
            >
                {/* Version minimaliste et stylée de l'indicateur */}
                {refreshing && (
                    <View
                        style={styles.inlineRefresh}
                    >
                        <ActivityIndicator size="small" color="#0d9488" />
                        <Text style={styles.inlineRefreshText}>Mise à jour...</Text>
                    </View>
                )}

                {/* Bloc Prise de présence */}
                <View style={[styles.card, styles.presenceCard]}>
                    <View style={styles.presenceHeader}>
                        <View style={styles.qrIconSmallContainer}>
                            <QrCode size={18} color="#0d9488" />
                        </View>
                        <Text style={styles.presenceTitle}>Prise de présence</Text>

                        {offlineScansCount > 0 && (
                            <TouchableOpacity
                                style={styles.syncBadge}
                                onPress={async () => {
                                    const synced = await attendanceService.syncOfflineScans();
                                    if (synced && synced > 0) {
                                        Alert.alert("Succès", `${synced} scan(s) synchronisé(s).`);
                                        fetchDashboardData();
                                    }
                                }}
                            >
                                <ActivityIndicator size="small" color="#f59e0b" style={{ marginRight: 4 }} />
                                <Text style={styles.syncBadgeText}>{offlineScansCount} en attente</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <TouchableOpacity
                        style={styles.qrButton}
                        activeOpacity={0.8}
                        onPress={onOpenScanner}
                    >
                        <QrCode color="white" size={20} />
                        <Text style={styles.qrButtonText}>Scanner le QR Code</Text>
                    </TouchableOpacity>
                </View>

                {/* Section Statistiques de présence */}
                <TouchableOpacity onPress={openFullStats} activeOpacity={0.7}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Ma Progression</Text>
                        <Text style={styles.seeAllText}>Détails</Text>
                    </View>
                </TouchableOpacity>

                {/* Carte de Présence Globale - Cliquable */}
                {dashboardData?.stats ? (
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => setShowGlobalAttendance(true)}
                        style={styles.globalAttendanceCard}
                    >
                        <LinearGradient
                            colors={['#0d9488', '#0f766e']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.globalAttendanceGradient}
                        >
                            <View style={styles.globalAttendanceContent}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.globalAttendanceLabel}>Présence Globale</Text>
                                    <Text style={styles.globalAttendanceStatus}>
                                        {(dashboardData.stats.attendance ?? 0) >= 80 ? 'Excellente progression' :
                                            (dashboardData.stats.attendance ?? 0) >= 50 ? 'Progression stable' : 'Attention requise'}
                                    </Text>
                                </View>
                                <View style={styles.globalAttendanceCircle}>
                                    <Text style={styles.globalAttendanceValue}>{dashboardData.stats.attendance ?? 0}%</Text>
                                </View>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                ) : isLoadingData ? (
                    <View style={[styles.globalAttendanceCard, { backgroundColor: '#f1f5f9', height: 100, justifyContent: 'center', alignItems: 'center' }]}>
                        <ActivityIndicator color="#0d9488" />
                    </View>
                ) : null}

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsList}>
                    {isLoadingData ? (
                        [1, 2, 3].map(i => (
                            <View key={i} style={styles.statCard}>
                                <Skeleton width={60} height={60} borderRadius={30} style={{ marginBottom: 10 }} />
                                <Skeleton width={80} height={12} style={{ marginBottom: 6 }} />
                                <Skeleton width={50} height={10} />
                            </View>
                        ))
                    ) : (dashboardData?.stats?.courses || []).length > 0 ? (
                        [...(dashboardData?.stats?.courses || [])]
                            .sort((a, b) => (b.percentage || 0) - (a.percentage || 0))
                            .map((stat: CourseStats) => {
                            const isFinished = stat.status === 'FINISHED';
                            const displayPct = stat.percentage ?? 0;
                            const circleColor = getAttendanceColor(displayPct);
                            return (
                                <TouchableOpacity
                                    key={stat.id}
                                    style={[styles.statCard, isFinished && { borderColor: '#d1fae5', borderWidth: 1.5 }]}
                                    onPress={() => openCourseDetails(stat)}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.progressCircle, { borderColor: circleColor + '30', borderWidth: 4 }]}>
                                        <Text
                                            style={[styles.statPercentage, { color: circleColor }]}
                                            numberOfLines={1}
                                            adjustsFontSizeToFit
                                        >
                                            {displayPct}%
                                        </Text>
                                    </View>
                                    {isFinished || stat.isCompleted ? (
                                        <View style={{ backgroundColor: '#d1fae5', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, marginTop: 2 }}>
                                            <Text style={{ color: '#065f46', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 }}>{'\u2713 TERMIN\u00c9'}</Text>
                                        </View>
                                    ) : (
                                        <View style={styles.statFooterRow}>
                                            <Text style={styles.statDetails}>
                                                {stat.attendedCount || 0}/{stat.totalCount || 0} p.
                                            </Text>
                                            {stat.isComplement && (
                                                <View style={{ backgroundColor: '#fef3c7', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, marginLeft: 4 }}>
                                                    <Text style={{ color: '#d97706', fontSize: 8, fontWeight: 'bold' }}>COMPL.</Text>
                                                </View>
                                            )}
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })
                    ) : (
                        renderEmptyState("Aucune statistique disponible")
                    )}
                </ScrollView>

                {/* Section Publicités (Carousel Manuel) */}
                <View style={[styles.adCarouselContainer, { marginHorizontal: -20 }]}>
                    {(!ads || ads.length === 0) ? (
                        <View style={[styles.adCard, { width: width - 40, alignSelf: 'center', backgroundColor: '#f1f5f9', borderStyle: 'dashed', borderWidth: 2, borderColor: '#cbd5e1' }]}>
                            <View style={styles.adImagePlaceholderFull}>
                                <ImagePlus color="#94a3b8" size={40} />
                                <Text style={{ color: '#94a3b8', fontWeight: 'bold', marginTop: 10 }}>Espace Publicitaire Unilu</Text>
                            </View>
                        </View>
                    ) : (
                        <>
                            <FlatList
                                ref={adScrollRef}
                                data={ads}
                                keyExtractor={(item, index) => item.id || index.toString()}
                                horizontal
                                pagingEnabled={true}
                                showsHorizontalScrollIndicator={false}
                                onMomentumScrollEnd={handleAdScroll}
                                scrollEventThrottle={16}
                                decelerationRate="fast"
                                getItemLayout={(_, index) => ({
                                    length: width,
                                    offset: width * index,
                                    index,
                                })}
                                renderItem={({ item: ad }) => (
                                    <View style={{ width: width, alignItems: 'center' }}>
                                        <TouchableOpacity
                                            activeOpacity={0.9}
                                            onPress={() => {
                                                if (ad.id) studentService.trackAdClick(ad.id);
                                                if (ad.linkUrl) Linking.openURL(ad.linkUrl);
                                            }}
                                            style={[styles.adCard, { width: width - 40 }]}
                                        >
                                            <View style={styles.adBadgeTopRight}>
                                                <Text style={styles.adBadgeText}>SPONSORISÉ</Text>
                                            </View>

                                            {ad.imageUrl ? (
                                                <View style={styles.adBannerWrapper}>
                                                    <Image
                                                        source={{ uri: ad.imageUrl }}
                                                        style={styles.adFullImage}
                                                        resizeMode="cover"
                                                    />
                                                    <LinearGradient
                                                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                                                        style={styles.adOverlay}
                                                    />
                                                </View>
                                            ) : (
                                                <View style={styles.adImagePlaceholderFull}>
                                                    <ImagePlus color="#94a3b8" size={32} />
                                                </View>
                                            )}

                                            <View style={styles.adContentContainer}>
                                                <View style={{ flex: 1, justifyContent: 'center' }}>
                                                    <Text style={styles.adCanvaTitle}>{ad.title}</Text>
                                                    <Text style={styles.adCanvaDesc} numberOfLines={2}>
                                                        {ad.description || "Découvrez cette offre exclusive pour les étudiants."}
                                                    </Text>

                                                    <View style={styles.adCanvaButton}>
                                                        <Text style={styles.adCanvaButtonText}>En savoir plus</Text>
                                                        <ArrowRight size={16} color="white" style={{ marginLeft: 6 }} />
                                                    </View>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            />

                            {ads.length > 1 && (
                                <View style={styles.adDots}>
                                    {ads.map((_, i) => (
                                        <View
                                            key={i}
                                            style={[
                                                styles.adDot,
                                                currentAdIndex === i ? styles.adDotActive : styles.adDotInactive
                                            ]}
                                        />
                                    ))}
                                </View>
                            )}
                        </>
                    )}
                </View>

                {/* Section Historique Récent */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Historique Récent</Text>
                    <TouchableOpacity onPress={openFullHistory}>
                        <Text style={styles.seeAllText}>Tout voir</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.historyCard}>
                    {isLoadingData ? (
                        [1, 2, 3].map(i => (
                            <View key={i} style={[styles.historyItem, i === 3 && { borderBottomWidth: 0 }]}>
                                <Skeleton width={12} height={12} borderRadius={6} style={{ marginRight: 12 }} />
                                <View style={{ flex: 1 }}>
                                    <Skeleton width="60%" height={14} style={{ marginBottom: 8 }} />
                                    <Skeleton width="40%" height={10} />
                                </View>
                                <Skeleton width={80} height={24} borderRadius={12} />
                            </View>
                        ))
                    ) : (() => {
                        const mergedHistory = [
                            ...offlineScans.map(s => ({
                                id: `offline-${s.timestamp}`,
                                courseName: 'Présence Hors-ligne',
                                date: s.timestamp,
                                time: new Date(s.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                                status: 'pending'
                            })),
                            ...(dashboardData?.recentAttendance || [])
                        ];

                        if (mergedHistory.length === 0) return renderEmptyState("Aucun historique récent");

                        const recentHistory = mergedHistory.slice(0, 5);
                        return recentHistory.map((item: any, index: number) => {
                            const info = getStatusInfo(item.status.toLowerCase());
                            return (
                                <View key={item.id} style={[styles.historyItem, index === recentHistory.length - 1 && { borderBottomWidth: 0 }]}>
                                    <View style={[styles.historyStatusDot, { backgroundColor: info.color }]} />
                                    <View style={styles.historyMainInfo}>
                                        <Text style={styles.historyCourse}>{item.courseName}</Text>
                                        <Text style={styles.historyDate}>{new Date(item.date).toLocaleDateString()} • {item.time || 'Session'}</Text>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: info.bgColor }]}>
                                        <Text style={[styles.statusBadgeText, { color: info.color }]}>
                                            {info.label}
                                        </Text>
                                    </View>
                                </View>
                            );
                        });
                    })()}
                </View>

                {/* Annonces déplacées dans l'onglet dédié */}
            </Animated.ScrollView>
        );
    };

    const renderCoursesTab = () => {
        if (activeTab !== 'courses') return null;
        return (
            <Animated.ScrollView 
                style={styles.tabContent} 
                contentContainerStyle={styles.tabScrollPadding}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
            >
                <Text style={styles.tabTitle}>Mes Cours</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.tabSubtitle}>Liste complète de vos matières</Text>
                    <TouchableOpacity
                        style={styles.enrollOpenBtn}
                        onPress={() => {
                            fetchAvailableCourses();
                            setShowEnrollmentModal(true);
                        }}
                    >
                        <Plus size={16} color="white" />
                        <Text style={styles.enrollOpenBtnText}>S'inscrire</Text>
                    </TouchableOpacity>
                </View>

                {isLoadingData ? (
                    [1, 2, 3, 4].map(i => (
                        <View key={i} style={styles.courseRow}>
                            <Skeleton width={4} height={40} borderRadius={2} style={{ marginRight: 15 }} />
                            <View style={{ flex: 1 }}>
                                <Skeleton width="70%" height={16} style={{ marginBottom: 8 }} />
                                <Skeleton width="40%" height={12} />
                            </View>
                        </View>
                    ))
                ) : coursesData.length > 0 ? (
                    [...coursesData]
                        .sort((a, b) => (b.percentage || 0) - (a.percentage || 0))
                        .map((course: CourseStats) => {
                        const isFinished = course.status === 'FINISHED';
                        const progression = isFinished ? 100 : (course.courseProgress ?? 0);
                        return (
                            <TouchableOpacity
                                key={course.id}
                                style={[
                                    styles.courseRow,
                                    isFinished && { backgroundColor: '#f0fdf4', borderLeftColor: '#10b981' }
                                ]}
                                onPress={() => openCourseDetails(course)}
                            >
                                <View style={[styles.courseColorBar, { backgroundColor: isFinished ? '#10b981' : '#0d9488' }]} />
                                <View style={styles.courseRowInfo}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Text style={[styles.courseRowName, { flex: 1, marginRight: 8 }]}>{course.name}</Text>
                                        <View style={{ flexDirection: 'row', gap: 4 }}>
                                            {course.isComplement && (
                                                <View style={{ backgroundColor: '#fff7ed', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#ffedd5' }}>
                                                    <Text style={{ color: '#c2410c', fontSize: 8, fontWeight: '900' }}>COMPLÉMENT</Text>
                                                </View>
                                            )}
                                            {(isFinished || course.isCompleted) && (
                                                <View style={{ backgroundColor: '#d1fae5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                                                    <Text style={{ color: '#065f46', fontSize: 8, fontWeight: '900' }}>TERMINÉ</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <Text style={styles.courseRowMeta}>
                                            {course.attendedCount ?? 0}/{course.totalCount ?? 0} présences
                                        </Text>
                                        <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#cbd5e1' }} />
                                        <Text style={[styles.courseRowMeta, { color: '#0d9488', fontWeight: '600' }]}>
                                            {progression}% progression
                                        </Text>
                                    </View>
                                </View>
                                <ChevronRight size={18} color={isFinished ? '#10b981' : '#cbd5e1'} />
                            </TouchableOpacity>
                        );
                    })
                ) : (
                    renderEmptyState("Aucun cours inscrit")
                )}

            </Animated.ScrollView>
        );
    };

    const renderAnnouncementsTab = () => {
        if (activeTab !== 'announcements') return null;
        const announcements = dashboardData?.announcements || [];
        return (
            <Animated.ScrollView
                style={styles.tabContent}
                contentContainerStyle={[styles.tabScrollPadding, { paddingBottom: 40 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.announcementsHeader}>
                    <View style={styles.announcementsIconBig}>
                        <Megaphone size={26} color="#0d9488" />
                        {unreadCount > 0 && (
                            <View style={styles.announcementsBadge}>
                                <Text style={styles.announcementsBadgeText}>{unreadCount}</Text>
                            </View>
                        )}
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.tabTitle}>Annonces</Text>
                        <Text style={styles.tabSubtitle}>Communications officielles de la faculté</Text>
                    </View>
                    {unreadCount > 0 && (
                        <TouchableOpacity onPress={markAllAsRead} style={styles.markAllReadButton}>
                            <Text style={styles.markReadText}>Tout lire</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Liste annonces */}
                {announcements.length === 0 ? (
                    <View style={styles.emptyAnnouncementsState}>
                        <Megaphone size={52} color="#cbd5e1" strokeWidth={1} />
                        <Text style={styles.emptyAnnouncementsText}>Aucune annonce pour le moment</Text>
                        <Text style={styles.emptyAnnouncementsSubText}>Les communications de la faculté apparaîtront ici</Text>
                    </View>
                ) : (
                    announcements.map((notif: any) => (
                        <TouchableOpacity
                            key={notif.id}
                            style={[
                                styles.fullNotifItem,
                                readNotifications.has(notif.id) && styles.notifItemRead
                            ]}
                            onPress={() => openNotification(notif)}
                            activeOpacity={0.75}
                        >
                            <View style={styles.fullNotifIcon}>
                                <Bell size={20} color={readNotifications.has(notif.id) ? '#94a3b8' : '#0d9488'} />
                                {!readNotifications.has(notif.id) && <View style={styles.fullNotifDot} />}
                            </View>
                            <View style={styles.fullNotifContent}>
                                <Text style={[styles.fullNotifTitle, readNotifications.has(notif.id) && styles.fullNotifTitleRead]}>{notif.title}</Text>
                                {notif.author && (
                                    <View style={styles.authorBadge}>
                                        <UserIcon size={10} color="#0d9488" />
                                        <Text style={styles.authorBadgeText}>{notif.author}</Text>
                                    </View>
                                )}
                                <Text style={styles.fullNotifDesc} numberOfLines={2}>{notif.content}</Text>
                                <Text style={styles.fullNotifDate}>{new Date(notif.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</Text>
                            </View>
                            <ChevronRight size={18} color="#cbd5e1" />
                        </TouchableOpacity>
                    ))
                )}
            </Animated.ScrollView>
        );
    };

    const renderCalendarTab = () => {
        if (activeTab !== 'calendar') return null;
        return (
            <Animated.ScrollView 
                style={styles.tabContent} 
                contentContainerStyle={styles.tabScrollPadding}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
            >
                <Text style={styles.tabTitle}>Emploi du Temps</Text>
                <Text style={styles.tabSubtitle}>Votre programme hebdomadaire</Text>

                {/* Section Examens */}
                {examsData.length > 0 && (
                    <View style={{ marginBottom: 30 }}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: '#ef4444' }]}>Examens & Interros</Text>
                            <View style={[styles.newBadge, { backgroundColor: '#fee2e2' }]}>
                                <Text style={[styles.newBadgeText, { color: '#ef4444' }]}>{examsData.length} planifiés</Text>
                            </View>
                        </View>
                        {examsData.map((exam: any) => (
                            <View key={exam.id} style={[styles.scheduleSession, { borderLeftWidth: 4, borderLeftColor: '#ef4444' }]}>
                                <View style={[styles.scheduleTimeContainer, { width: 75 }]}>
                                    <Text style={[styles.scheduleTime, { fontSize: 13 }]}>
                                        {new Date(exam.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                    </Text>
                                    <Text style={[styles.scheduleTimeSub, { marginTop: 0 }]}>
                                        {new Date(exam.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </View>
                                <View style={styles.scheduleCourseContainer}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                                        <Text style={[styles.scheduleCourseName, { flex: 1 }]}>{exam.title}</Text>
                                        <View style={{ backgroundColor: exam.type === 'Examen' ? '#fef2f2' : '#eff6ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start' }}>
                                            <Text style={{ fontSize: 10, fontWeight: '800', color: exam.type === 'Examen' ? '#ef4444' : '#3b82f6' }}>{exam.type.toUpperCase()}</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.scheduleTimeSub}>
                                        Salle: <Text style={{ color: '#475569', fontWeight: '700' }}>{exam.room}</Text>
                                        {exam.duration && ` • Durée: ${exam.duration} min`}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                <View style={styles.detailDivider} />
                <Text style={[styles.sectionTitle, { marginBottom: 15, marginTop: 10 }]}>Cours de la semaine</Text>

                {isLoadingData ? (
                    [1, 2].map(i => (
                        <View key={i} style={styles.scheduleDayBlock}>
                            <Skeleton width={100} height={20} style={{ marginBottom: 15 }} />
                            <Skeleton width="100%" height={80} borderRadius={18} />
                        </View>
                    ))
                ) : scheduleData ? (
                    Object.entries(scheduleData).map(([day, sessions]: [string, any]) => (
                        sessions.length > 0 && (
                            <View key={day} style={styles.scheduleDayBlock}>
                                <Text style={styles.scheduleDayTitle}>{day}</Text>
                                {sessions.map((session: any, idx: number) => (
                                    <View key={idx} style={styles.scheduleSession}>
                                        <View style={styles.scheduleTimeContainer}>
                                            <Text style={styles.scheduleTime}>{session.time.split('-')[0]}</Text>
                                        </View>
                                        <View style={styles.scheduleCourseContainer}>
                                            <Text style={styles.scheduleCourseName}>{session.course}</Text>
                                            <Text style={styles.scheduleTimeSub}>{session.time} • {session.room}</Text>
                                            <Text style={styles.scheduleProf}>{session.professor}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )
                    ))
                ) : (
                    renderEmptyState("Horaire non disponible")
                )}
            </Animated.ScrollView>
        );
    };

    const countries = [
        { name: 'Congolaise (RDC)', code: 'CD', flag: '🇨🇩' },
        { name: 'Angolaise', code: 'AO', flag: '🇦🇴' },
        { name: 'Zambienne', code: 'ZM', flag: '🇿🇲' },
        { name: 'Tanzanienne', code: 'TZ', flag: '🇹🇿' },
        { name: 'Burundaise', code: 'BI', flag: '🇧🇮' },
        { name: 'Rwandaise', code: 'RW', flag: '🇷🇼' },
        { name: 'Ougandaise', code: 'UG', flag: '🇺🇬' },
        { name: 'Congolaise (Brazza)', code: 'CG', flag: '🇨🇬' },
        { name: 'Centrafricaine', code: 'CF', flag: '🇨🇫' },
        { name: 'Soudanaise', code: 'SD', flag: '🇸🇩' },
        { name: 'Française', code: 'FR', flag: '🇫🇷' },
        { name: 'Belge', code: 'BE', flag: '🇧🇪' },
        { name: 'Américaine', code: 'US', flag: '🇺🇸' },
        { name: 'Autre', code: 'XX', flag: '🌍' },
    ];

    const AdManagerModal = () => {
        if (!isAdAdminVisible) return null;

        return (
            <Animated.View style={[styles.detailOverlay, { opacity: adAdminAnim }]}>
                <SafeAreaView style={styles.detailContainer}>
                    <View style={styles.adminModalHeader}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.modalTitle}>Régie Publicitaire</Text>
                            <Text style={styles.modalSubtitle}>Gérez vos partenariats en direct</Text>
                        </View>
                        <TouchableOpacity style={styles.closeButton} onPress={closeAdAdmin}>
                            <ArrowLeft size={24} color="#1e293b" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                        {isCreatingAd ? (
                            <View style={styles.adFormCard}>
                                <Text style={styles.sectionLabel}>Nouvelle Publicité</Text>

                                <TouchableOpacity style={styles.imagePickerBtn} onPress={handlePickImage}>
                                    {selectedAdImage ? (
                                        <Image source={{ uri: selectedAdImage }} style={styles.pickedImage} />
                                    ) : (
                                        <View style={styles.pickerPlaceholder}>
                                            <ImagePlus size={40} color="#0d9488" />
                                            <Text style={styles.pickerText}>Sélectionner une image (16:9)</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>

                                <TextInput
                                    style={styles.adminInput}
                                    placeholder="Titre de la publicité (ex: Promo Laptop Pro)"
                                    placeholderTextColor="#94a3b8"
                                    value={newAdForm.title}
                                    onChangeText={t => setNewAdForm({ ...newAdForm, title: t })}
                                />

                                <TextInput
                                    style={styles.adminInput}
                                    placeholder="Lien de redirection (https://...)"
                                    placeholderTextColor="#94a3b8"
                                    value={newAdForm.linkUrl}
                                    onChangeText={t => setNewAdForm({ ...newAdForm, linkUrl: t })}
                                />

                                <TextInput
                                    style={styles.adminInput}
                                    placeholder="Limite de notifications / jour"
                                    placeholderTextColor="#94a3b8"
                                    keyboardType="numeric"
                                    value={newAdForm.dailyLimit}
                                    onChangeText={t => setNewAdForm({ ...newAdForm, dailyLimit: t })}
                                />

                                <View style={styles.notifyConfig}>
                                    <Text style={styles.smallLabel}>Configuration Push (Optionnel)</Text>
                                    <TextInput
                                        style={styles.adminInput}
                                        placeholder="Titre Notification"
                                        placeholderTextColor="#94a3b8"
                                        value={newAdForm.pushTitle}
                                        onChangeText={t => setNewAdForm({ ...newAdForm, pushTitle: t })}
                                    />
                                    <TextInput
                                        style={[styles.adminInput, { height: 80, textAlignVertical: 'top' }]}
                                        placeholder="Corps du message"
                                        placeholderTextColor="#94a3b8"
                                        multiline
                                        value={newAdForm.pushBody}
                                        onChangeText={t => setNewAdForm({ ...newAdForm, pushBody: t })}
                                    />
                                </View>

                                <View style={styles.btnGroup}>
                                    <TouchableOpacity
                                        style={[styles.btn, styles.btnCancel]}
                                        onPress={() => setIsCreatingAd(false)}
                                    >
                                        <Text style={styles.btnTextCancel}>Annuler</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.btn, styles.btnSubmit]}
                                        onPress={handleCreateAd}
                                        disabled={isSubmittingAd}
                                    >
                                        {isSubmittingAd ? <ActivityIndicator color="white" /> : (
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                <Send size={18} color="white" />
                                                <Text style={styles.btnTextSubmit}>Publier</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <View style={{ padding: 20 }}>
                                <TouchableOpacity
                                    style={styles.addNewBtn}
                                    onPress={() => setIsCreatingAd(true)}
                                >
                                    <Plus size={24} color="white" />
                                    <Text style={styles.addNewBtnText}>Créer une campagne</Text>
                                </TouchableOpacity>

                                <Text style={styles.sectionTitle}>Campagnes Actives</Text>

                                {adminAds.length === 0 ? (
                                    <View style={styles.emptyAdsContainer}>
                                        <Megaphone size={48} color="#cbd5e1" strokeWidth={1} />
                                        <Text style={styles.emptyText}>Aucune publicité en cours</Text>
                                    </View>
                                ) : (
                                    adminAds.map(ad => (
                                        <View key={ad.id} style={styles.adminAdCard}>
                                            <Image source={{ uri: ad.imageUrl }} style={styles.adminAdThumb} />
                                            <View style={styles.adminAdInfo}>
                                                <Text style={styles.adminAdTitle} numberOfLines={1}>{ad.title}</Text>
                                                <View style={styles.quotaRow}>
                                                    <View style={styles.quotaBarBg}>
                                                        <View style={[styles.quotaBarFill, { width: `${(ad.sentToday / ad.dailyLimit) * 100}%` }]} />
                                                    </View>
                                                    <Text style={styles.adminAdStats}>{ad.sentToday}/{ad.dailyLimit}</Text>
                                                </View>

                                                <View style={styles.adminAdActions}>
                                                    <TouchableOpacity
                                                        style={styles.actionBtnNotify}
                                                        onPress={() => handleTriggerNotify(ad.id)}
                                                    >
                                                        <Bell size={14} color="white" />
                                                        <Text style={styles.actionBtnText}>Notifier</Text>
                                                    </TouchableOpacity>

                                                    <TouchableOpacity
                                                        style={styles.actionBtnDelete}
                                                        onPress={() => handleDeleteAd(ad.id)}
                                                    >
                                                        <Trash2 size={16} color="#ef4444" />
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        </View>
                                    ))
                                )}
                            </View>
                        )}
                    </ScrollView>
                </SafeAreaView>
            </Animated.View>
        );
    };

    const renderProfileTab = () => {
        if (activeTab !== 'profile') return null;

        const hasChanges = editName !== (profileData?.name || '') ||
            editEmail !== (profileData?.email || '') ||
            editSex !== (profileData?.sex || '') ||
            editBirthday !== (profileData?.birthday ? new Date(profileData.birthday).toISOString().split('T')[0] : '') ||
            editNationality !== (profileData?.nationality || '') ||
            editWhatsapp !== (profileData?.whatsapp || '');

        return (
            <Animated.ScrollView 
                style={styles.tabContent} 
                contentContainerStyle={styles.tabScrollPadding}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
            >
                <View style={styles.profileHeader}>
                    <TouchableOpacity
                        style={styles.profileEditToggle}
                        onPress={() => {
                            if (isEditingProfile) {
                                // Annuler : reset les champs vers les données d'origine
                                setEditName(profileData?.name || '');
                                setEditEmail(profileData?.email || '');
                                setEditSex(profileData?.sex || '');
                                setEditBirthday(profileData?.birthday ? new Date(profileData.birthday).toISOString().split('T')[0] : '');
                                setEditNationality(profileData?.nationality || '');
                                setEditWhatsapp(profileData?.whatsapp || '');
                            }
                            setIsEditingProfile(!isEditingProfile);
                        }}
                    >
                        <Text style={styles.profileEditToggleText}>
                            {isEditingProfile ? "Annuler" : "Modifier"}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.profileAvatarBig}
                        onPress={() => onOpenProfilePhoto(overridePhotoUrl ?? profileData?.profilePhotoUrl ?? null)}
                    >
                        {(overridePhotoUrl || profileData?.profilePhotoUrl) ? (
                            <Image 
                                source={{ uri: overridePhotoUrl || profileData.profilePhotoUrl }} 
                                style={styles.profileAvatarImage} 
                            />
                        ) : (
                            <UserIcon size={40} color="white" />
                        )}
                        <View style={styles.editPhotoBadge}>
                            <Camera size={12} color="white" />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.profileName}>{profileData?.name || '...'}</Text>
                    <Text style={styles.profileClass}>{profileData?.academicLevel || '...'}</Text>
                </View>

                <View style={styles.profileInfoCard}>
                    <View style={styles.profileInfoItem}>
                        <Text style={styles.profileInfoLabel}>Nom Complet</Text>
                        <TextInput
                            style={[styles.profileInput, !isEditingProfile && styles.profileInputDisabled]}
                            placeholder="Ex: David Kasilmebo"
                            value={editName}
                            onChangeText={setEditName}
                            editable={isEditingProfile}
                        />
                    </View>
                    <View style={styles.profileInfoDivider} />

                    <View style={styles.profileInfoItem}>
                        <Text style={styles.profileInfoLabel}>Matricule (Lecture seule)</Text>
                        <Text style={styles.profileInfoValue}>{profileData?.idNumber || '...'}</Text>
                    </View>
                    <View style={styles.profileInfoDivider} />

                    <View style={styles.profileInfoItem}>
                        <Text style={styles.profileInfoLabel}>Email</Text>
                        <TextInput
                            style={[styles.profileInput, !isEditingProfile && styles.profileInputDisabled]}
                            placeholder="votre@email.com"
                            value={editEmail}
                            onChangeText={setEditEmail}
                            keyboardType="email-address"
                            editable={isEditingProfile}
                            autoCapitalize="none"
                        />
                    </View>
                    <View style={styles.profileInfoDivider} />

                    <View style={styles.profileInfoItem}>
                        <Text style={styles.profileInfoLabel}>Sexe</Text>
                        <View style={styles.profileEditRow}>
                            <TouchableOpacity
                                style={[styles.sexOption, editSex === 'M' && styles.sexOptionActive, !isEditingProfile && { opacity: 0.5 }]}
                                onPress={() => isEditingProfile && setEditSex('M')}
                                disabled={!isEditingProfile}
                            >
                                <Text style={[styles.sexOptionText, editSex === 'M' && styles.sexOptionTextActive]}>Masculin</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.sexOption, editSex === 'F' && styles.sexOptionActive, !isEditingProfile && { opacity: 0.5 }]}
                                onPress={() => isEditingProfile && setEditSex('F')}
                                disabled={!isEditingProfile}
                            >
                                <Text style={[styles.sexOptionText, editSex === 'F' && styles.sexOptionTextActive]}>Féminin</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={styles.profileInfoDivider} />

                    <View style={styles.profileInfoItem}>
                        <Text style={styles.profileInfoLabel}>Nationalité</Text>
                        <TouchableOpacity
                            style={[styles.profileInput, !isEditingProfile && styles.profileInputDisabled]}
                            onPress={() => isEditingProfile && setIsCountryModalVisible(true)}
                            disabled={!isEditingProfile}
                        >
                            <Text style={styles.profileInputText}>
                                {editNationality ?
                                    (countries.find(c => c.name === editNationality)?.flag || '🌍') + ' ' + editNationality
                                    : "Sélectionner votre nationalité"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.profileInfoDivider} />

                    <View style={styles.profileInfoItem}>
                        <Text style={styles.profileInfoLabel}>Numéro WhatsApp</Text>
                        <TextInput
                            style={[styles.profileInput, !isEditingProfile && styles.profileInputDisabled]}
                            placeholder="Ex: +243 820 000 000"
                            value={editWhatsapp}
                            onChangeText={setEditWhatsapp}
                            keyboardType="phone-pad"
                            editable={isEditingProfile}
                        />
                    </View>
                    <View style={styles.profileInfoDivider} />

                    <View style={styles.profileInfoItem}>
                        <Text style={styles.profileInfoLabel}>Date de Naissance (AAAA-MM-JJ)</Text>
                        <TextInput
                            style={[styles.profileInput, !isEditingProfile && styles.profileInputDisabled]}
                            placeholder="Ex: 2000-01-01"
                            value={editBirthday}
                            onChangeText={setEditBirthday}
                            keyboardType="numeric"
                            editable={isEditingProfile}
                        />
                    </View>

                    {isEditingProfile && hasChanges && (
                        <TouchableOpacity
                            style={styles.saveProfileButton}
                            disabled={isUpdatingProfile}
                            onPress={async () => {
                                setIsUpdatingProfile(true);
                                try {
                                    await studentService.updateProfile({
                                        name: editName,
                                        sex: editSex,
                                        birthday: editBirthday,
                                        nationality: editNationality,
                                        whatsapp: editWhatsapp
                                    });
                                    const updatedProfile = await studentService.getProfile();
                                    setProfileData(updatedProfile);
                                    setIsEditingProfile(false); // Sortir du mode édition après sauvegarde
                                    Alert.alert("Succès", "Profil mis à jour");
                                } catch (error) {
                                    Alert.alert("Erreur", "Impossible de mettre à jour le profil");
                                } finally {
                                    setIsUpdatingProfile(false);
                                }
                            }}
                        >
                            {isUpdatingProfile ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.saveProfileButtonText}>Enregistrer les modifications</Text>}
                        </TouchableOpacity>
                    )}

                    <View style={styles.profileInfoDivider} />
                    <View style={styles.profileInfoItem}>
                        <Text style={styles.profileInfoLabel}>Faculté</Text>
                        <Text style={styles.profileInfoValue}>{profileData?.faculty || '...'}</Text>
                    </View>
                    <View style={styles.profileInfoDivider} />
                    <View style={styles.profileInfoItem}>
                        <Text style={styles.profileInfoLabel}>Année Académique</Text>
                        <Text style={styles.profileInfoValue}>{profileData?.academicYear || '...'}</Text>
                    </View>
                </View>

                {/* Espace Admin Publicité - Uniquement pour DAVID KASILMEBO ou ADMIN role */}
                {profileData?.role === 'ADMIN' && (
                    <TouchableOpacity
                        style={[styles.saveProfileButton, { backgroundColor: '#0f766e', marginTop: 10, borderColor: '#115e59', borderWidth: 1 }]}
                        onPress={openAdAdmin}
                    >
                        <Megaphone size={20} color="white" style={{ marginRight: 10 }} />
                        <Text style={styles.saveProfileButtonText}>Contrôle Régie Publicitaire</Text>
                    </TouchableOpacity>
                )}

                {/* Bouton secret de déconnexion - apparaît uniquement avec le mot de passe 'admin' */}
                {searchText.toLowerCase() === 'admin' && (
                    <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
                        <LogOut size={20} color="#ef4444" />
                        <Text style={styles.logoutButtonText}>Déconnexion (Mode Admin)</Text>
                    </TouchableOpacity>
                )}

                <Modal
                    visible={isCountryModalVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setIsCountryModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.countryModalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Votre nationalité</Text>
                                <TouchableOpacity onPress={() => setIsCountryModalVisible(false)}>
                                    <Text style={styles.modalCloseText}>Fermer</Text>
                                </TouchableOpacity>
                            </View>
                            <FlatList
                                data={countries}
                                keyExtractor={(item) => item.code}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.countryItem}
                                        onPress={() => {
                                            setEditNationality(item.name);
                                            setIsCountryModalVisible(false);
                                        }}
                                    >
                                        <Text style={styles.countryFlag}>{item.flag}</Text>
                                        <Text style={styles.countryName}>{item.name}</Text>
                                        {editNationality === item.name && <CheckCircle size={18} color="#0d9488" />}
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    </View>
                </Modal>
            </Animated.ScrollView>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {activeTab === 'home' && (
                <Animated.View style={[styles.header, { height: headerHeight }]}>
                    <LinearGradient
                        colors={['#0f766e', '#115e59']}
                        style={StyleSheet.absoluteFill}
                    />
                    <SafeAreaView>
                        <View style={styles.headerContent}>
                            <Animated.View style={[styles.userInfo, { opacity: headerTextOpacity }]}>
                                <View style={styles.connectionBadgeRow}>
                                    <Text style={styles.greeting}>Bonjour,</Text>
                                    <View style={[styles.connectionIndicator, { backgroundColor: isConnected ? '#10b981' : '#ef4444' }]}>
                                        {isConnected ? <Wifi size={10} color="white" /> : <WifiOff size={10} color="white" />}
                                        <Text style={styles.connectionText}>{isConnected ? 'En ligne' : 'Hors-ligne'}</Text>
                                    </View>
                                </View>
                                <Text style={styles.userName} numberOfLines={2} adjustsFontSizeToFit>{dashboardData?.student?.name || 'Étudiant'}</Text>
                                <Text style={styles.userClass}>{dashboardData?.student?.level || 'Chargement...'}</Text>
                            </Animated.View>

                            <View style={styles.headerActions}>
                                <View style={styles.searchBar}>
                                    <Search size={18} color="rgba(255,255,255,0.6)" />
                                    <TextInput
                                        style={styles.searchInput}
                                        placeholder="Rechercher"
                                        placeholderTextColor="rgba(255,255,255,0.4)"
                                        value={searchText}
                                        onChangeText={setSearchText}
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>
                        </View>
                    </SafeAreaView>
                </Animated.View>
            )}

            <View style={styles.mainContent}>
                {renderHomeContent()}
                {renderCoursesTab()}
                {renderAnnouncementsTab()}
                {renderCalendarTab()}
                {renderProfileTab()}
            </View>


            {/* Course Detail Overlay */}
            {
                selectedCourse && (
                    <Animated.View style={[styles.detailOverlay, { opacity: courseDetailAnim }]}>
                        <SafeAreaView style={styles.detailContainer}>
                            <TouchableOpacity style={styles.backButton} onPress={closeCourseDetails}>
                                <ArrowLeft size={24} color="#1e293b" />
                                <Text style={styles.backButtonText}>Fermer</Text>
                            </TouchableOpacity>

                            <View style={styles.courseHeaderDetail}>
                                <View style={[styles.courseIconDetail, { backgroundColor: selectedCourse.color + '15' }]}>
                                    <BookOpen size={24} color={selectedCourse.color} />
                                </View>
                                <Text style={styles.courseTitleDetail}>{selectedCourse.name}</Text>
                                <Text style={styles.courseSubtitleDetail}>{dashboardData?.student?.level || '...'}</Text>
                            </View>

                            <View style={styles.statsOverview}>
                                <View style={styles.statMetric}>
                                    <Text style={[styles.metricValue, { color: getAttendanceColor(selectedCourse.percentage) }]}>
                                        {selectedCourse.percentage}%
                                    </Text>
                                    <Text style={styles.metricLabel}>Assiduité</Text>
                                </View>

                                {selectedCourse.status === 'FINISHED' ? (
                                    <View style={[styles.statMetric, { backgroundColor: '#f0fdf4', borderRadius: 12, paddingHorizontal: 10 }]}>
                                        <CheckCircle size={20} color="#10b981" />
                                        <Text style={{ color: '#10b981', fontSize: 10, fontWeight: 'bold', marginTop: 4 }}>COURS TERMINÉ</Text>
                                    </View>
                                ) : (
                                    <View style={styles.metricDivider} />
                                )}

                                    {selectedCourse.isComplement && (
                                        <View style={[styles.statMetric, { backgroundColor: '#fff7ed', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 }]}>
                                            <BookOpen size={18} color="#f97316" />
                                            <Text style={{ color: '#c2410c', fontSize: 9, fontWeight: 'bold', marginTop: 4 }}>COMPLÉMENT</Text>
                                        </View>
                                    )}

                                    {selectedCourse.isCompleted || selectedCourse.status === 'FINISHED' ? (
                                        <View style={[styles.statMetric, { backgroundColor: '#f0fdf4', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 }]}>
                                            <CheckCircle size={20} color="#10b981" />
                                            <Text style={{ color: '#065f46', fontSize: 9, fontWeight: 'bold', marginTop: 4 }}>COURS TERMINÉ</Text>
                                        </View>
                                    ) : (
                                        <View style={styles.metricDivider} />
                                    )}

                                    <View style={styles.statMetric}>
                                        <Text style={styles.metricValue}>{selectedCourse.attendedCount}/{selectedCourse.totalCount}</Text>
                                        <Text style={styles.metricLabel}>Cours suivis</Text>
                                    </View>
                                </View>

                                <Text style={styles.sessionHistoryTitle}>Communications du cours</Text>
                                <View style={styles.courseNotifsList}>
                                    {(dashboardData?.announcements || []).filter((n: any) => n.course === selectedCourse.name || n.courseId === selectedCourse.id).map((notif: any) => (
                                        <View key={notif.id} style={[styles.courseNotifItem, { borderLeftColor: selectedCourse.color }]}>
                                            <Text style={styles.courseNotifTitle}>{notif.title}</Text>
                                            <Text style={styles.courseNotifDesc}>{notif.content}</Text>
                                            <Text style={styles.courseNotifDate}>{new Date(notif.date).toLocaleDateString()}</Text>
                                        </View>
                                    ))}
                                    {(dashboardData?.announcements || []).filter((n: any) => n.course === selectedCourse.name || n.courseId === selectedCourse.id).length === 0 && (
                                        <Text style={styles.noNotifText}>Aucune annonce pour ce cours.</Text>
                                    )}
                                </View>

                                <Text style={[styles.sessionHistoryTitle, { marginTop: 20 }]}>Historique de présence</Text>
                                <ScrollView showsVerticalScrollIndicator={false}>
                                    {(dashboardData?.recentAttendance || []).filter((record: any) => {
                                        // Filter records for this specific course
                                        return record.courseName === selectedCourse.name;
                                    }).map((record: any) => {
                                        const info = getStatusInfo(record.status.toLowerCase());
                                        return (
                                            <View key={record.id} style={styles.sessionItem}>
                                                <View style={styles.sessionMain}>
                                                    <Text style={styles.sessionDate}>{new Date(record.date).toLocaleDateString('fr-FR')}</Text>
                                                    <Text style={styles.sessionTime}>{record.time}</Text>
                                                </View>
                                                <View style={styles.sessionRight}>
                                                    <Text style={[styles.sessionPoints, { color: info.color }]}>{info.points}</Text>
                                                    <View style={[styles.statusBadge, { backgroundColor: info.bgColor }]}>
                                                        <Text style={[styles.statusBadgeText, { color: info.color }]}>{info.label}</Text>
                                                    </View>
                                                </View>
                                            </View>
                                        );
                                    })}
                                    {(dashboardData?.recentAttendance || []).filter((record: any) => record.courseName === selectedCourse.name).length === 0 && (
                                        <Text style={styles.noNotifText}>Aucune présence enregistrée pour ce cours.</Text>
                                    )}

                                    {/* Désinscription section */}
                                    <View style={[styles.cautionSection, { marginTop: 30, marginBottom: 50 }]}>
                                        {!isUnenrolling ? (
                                            <TouchableOpacity
                                                style={styles.unenrollTrigger}
                                                onPress={() => setIsUnenrolling(true)}
                                            >
                                                <Trash2 size={20} color="#ef4444" />
                                                <Text style={styles.unenrollTriggerText}>Se désinscrire du cours</Text>
                                            </TouchableOpacity>
                                        ) : !showUnenrollAuth ? (
                                            <LinearGradient colors={['#fff', '#fff1f2']} style={styles.unenrollConfirmCard}>
                                                <View style={styles.cautionIconContainer}>
                                                    <AlertCircle size={24} color="#ef4444" />
                                                    <Text style={styles.cautionTitle}>Désinscription</Text>
                                                </View>
                                                <Text style={styles.cautionText}>
                                                    Cette action entraînera :
                                                    {'\n'}• La suppression de vos statistiques de présence.
                                                    {'\n'}• Le retrait immédiat du cours de votre planning.
                                                    {'\n'}• L'impossibilité de scanner votre présence.
                                                </Text>
                                                <View style={styles.cautionActions}>
                                                    <TouchableOpacity
                                                        style={styles.cautionCancel}
                                                        onPress={() => setIsUnenrolling(false)}
                                                    >
                                                        <Text style={styles.cautionCancelText}>Annuler</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={[styles.cautionConfirm, { backgroundColor: '#ef4444' }]}
                                                        onPress={() => setShowUnenrollAuth(true)}
                                                    >
                                                        <Text style={styles.cautionConfirmText}>Continuer</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </LinearGradient>
                                        ) : (
                                            <LinearGradient colors={['#fff', '#f0fdfa']} style={styles.unenrollConfirmCard}>
                                                <View style={styles.cautionIconContainer}>
                                                    <GraduationCap size={24} color="#0d9488" />
                                                    <Text style={[styles.cautionTitle, { color: '#0d9488' }]}>Vérification</Text>
                                                </View>
                                                <Text style={[styles.cautionText, { color: '#64748b' }]}>
                                                    Pour confirmer votre désinscription de ce cours, veuillez saisir votre mot de passe étudiant.
                                                </Text>
                                                <TextInput
                                                    style={[styles.cautionInput, { borderColor: '#ccfbf1' }]}
                                                    placeholder="Saisissez votre mot de passe"
                                                    secureTextEntry
                                                    value={unenrollPassword}
                                                    onChangeText={setUnenrollPassword}
                                                    autoFocus
                                                />
                                                <View style={styles.cautionActions}>
                                                    <TouchableOpacity
                                                        style={styles.cautionCancel}
                                                        onPress={() => setShowUnenrollAuth(false)}
                                                    >
                                                        <Text style={styles.cautionCancelText}>Retour</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={[styles.cautionConfirm, !unenrollPassword && { opacity: 0.5 }]}
                                                        onPress={handleUnenroll}
                                                        disabled={!unenrollPassword || isEnrolling}
                                                    >
                                                        {isEnrolling ? <ActivityIndicator color="white" size="small" /> : <Text style={styles.cautionConfirmText}>Désinscrire</Text>}
                                                    </TouchableOpacity>
                                                </View>
                                            </LinearGradient>
                                        )}
                                    </View>
                                </ScrollView>

            {/* Full Stats Overlay */}
            {
                showFullStats && (
                    <Animated.View style={[styles.detailOverlay, { opacity: fullStatsAnim }]}>
                        <SafeAreaView style={styles.detailContainer}>
                            <TouchableOpacity style={styles.backButton} onPress={closeFullStats}>
                                <ArrowLeft size={24} color="#1e293b" />
                                <Text style={styles.backButtonText}>Retour</Text>
                            </TouchableOpacity>

                            <Text style={styles.fullPageTitle}>Mes Cours</Text>
                            <Text style={styles.fullPageSubtitle}>Progression annuelle par matière</Text>

                            <ScrollView showsVerticalScrollIndicator={false} style={styles.fullListScroll}>
                                {coursesData.map((stat: any) => {
                                    const courseColor = stat.color || '#0d9488';
                                    return (
                                        <TouchableOpacity
                                            key={stat.id}
                                            style={[styles.fullStatCard, { borderLeftColor: courseColor, borderLeftWidth: 6, backgroundColor: courseColor + '08' }]}
                                            onPress={() => {
                                                closeFullStats();
                                                openCourseDetails(stat);
                                            }}
                                        >
                                            <View style={[styles.fullStatIcon, { backgroundColor: courseColor + '20' }]}>
                                                <BookOpen size={22} color={courseColor} />
                                            </View>
                                            <View style={styles.fullStatInfo}>
                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                                    <Text style={[styles.fullStatName, { color: '#1e293b', flex: 1 }]}>{stat.name}</Text>
                                                    <View style={[styles.percentBadge, { backgroundColor: getAttendanceColor(stat.percentage) }]}>
                                                        <Text style={[styles.fullStatPercent, { color: '#fff' }]}>{stat.percentage}%</Text>
                                                    </View>
                                                </View>

                                                <View style={styles.fullStatProgressRow}>
                                                    <View style={[styles.fullProgressBarBg, { backgroundColor: getAttendanceColor(stat.percentage) + '15' }]}>
                                                        <LinearGradient
                                                            colors={[getAttendanceColor(stat.percentage), getAttendanceColor(stat.percentage) + 'AA']}
                                                            start={{ x: 0, y: 0 }}
                                                            end={{ x: 1, y: 0 }}
                                                            style={[styles.fullProgressBarFill, { width: `${stat.percentage}%` }]}
                                                        >
                                                            <View style={styles.progressBarGlow} />
                                                        </LinearGradient>
                                                    </View>
                                                </View>

                                                <View style={styles.statMetaRow}>
                                                    <View style={styles.sessionBadge}>
                                                        <Text style={[styles.sessionBadgeText, { color: courseColor }]}>
                                                            {stat.attendedCount || 0} / {stat.totalCount || 0} SÉANCES
                                                        </Text>
                                                    </View>
                                                    <ChevronRight size={16} color="#94a3b8" />
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </SafeAreaView>
                    </Animated.View>
                )
            }

            {/* Full History Overlay */}
            {
                showFullHistory && (
                    <Animated.View style={[styles.detailOverlay, { opacity: fullHistoryAnim }]}>
                        <SafeAreaView style={styles.detailContainer}>
                            <TouchableOpacity style={styles.backButton} onPress={closeFullHistory}>
                                <ArrowLeft size={24} color="#1e293b" />
                                <Text style={styles.backButtonText}>Retour</Text>
                            </TouchableOpacity>

                            <Text style={styles.fullPageTitle}>Historique Complet</Text>
                            <Text style={styles.fullPageSubtitle}>Toutes vos présences enregistrées</Text>

                            <ScrollView showsVerticalScrollIndicator={false} style={styles.fullListScroll}>
                                {[...offlineScans.map(s => ({ ...s, status: 'pending', id: `off-${s.timestamp}` })), ...(dashboardData?.recentAttendance || [])].map((item: any) => {
                                    const info = getStatusInfo(item.status.toLowerCase());
                                    return (
                                        <View key={item.id} style={[styles.fullHistoryItem, item.status === 'pending' && { opacity: 0.7 }]}>
                                            <View style={[styles.fullHistorySideLine, { backgroundColor: info.color }]} />
                                            <View style={styles.fullHistoryContent}>
                                                <Text style={[styles.fullHistoryCourse, item.status === 'pending' && { color: '#94a3b8' }]}>{item.courseName}</Text>
                                                <View style={styles.fullHistoryMeta}>
                                                    <Text style={styles.fullHistoryDate}>{item.date} • {item.time}</Text>
                                                    <View style={[styles.statusBadge, { backgroundColor: info.bgColor }]}>
                                                        <Text style={[styles.statusBadgeText, { color: info.color }]}>{info.label}</Text>
                                                    </View>
                                                </View>
                                            </View>
                                        </View>
                                    );
                                })}
                            </ScrollView>
                        </SafeAreaView>
                    </Animated.View>
                )
            }

            {/* Bottom Tab Bar */}
            <View style={[styles.tabBarContainer, { paddingBottom: Math.max(insets.bottom, 15) }]}>
                <View style={styles.tabBar}>
                    <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('home')}>
                        <Home size={22} color={activeTab === 'home' ? '#0d9488' : '#94a3b8'} />
                        <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>Accueil</Text>
                        {activeTab === 'home' && <View style={styles.tabIndicator} />}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('courses')}>
                        <BookOpen size={22} color={activeTab === 'courses' ? '#0d9488' : '#94a3b8'} />
                        <Text style={[styles.tabLabel, activeTab === 'courses' && styles.tabLabelActive]}>Cours</Text>
                        {activeTab === 'courses' && <View style={styles.tabIndicator} />}
                    </TouchableOpacity>

                    {/* Onglet Annonces avec badge */}
                    <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('announcements')}>
                        <View style={{ position: 'relative' }}>
                            <Megaphone size={22} color={activeTab === 'announcements' ? '#0d9488' : '#94a3b8'} />
                            {unreadCount > 0 && (
                                <View style={styles.tabBadge}>
                                    <Text style={styles.tabBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                                </View>
                            )}
                        </View>
                        <Text style={[styles.tabLabel, activeTab === 'announcements' && styles.tabLabelActive]}>Annonces</Text>
                        {activeTab === 'announcements' && <View style={styles.tabIndicator} />}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('calendar')}>
                        <Calendar size={22} color={activeTab === 'calendar' ? '#0d9488' : '#94a3b8'} />
                        <Text style={[styles.tabLabel, activeTab === 'calendar' && styles.tabLabelActive]}>Planning</Text>
                        {activeTab === 'calendar' && <View style={styles.tabIndicator} />}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('profile')}>
                        <UserIcon size={22} color={activeTab === 'profile' ? '#0d9488' : '#94a3b8'} />
                        <Text style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}>Profil</Text>
                        {activeTab === 'profile' && <View style={styles.tabIndicator} />}
                    </TouchableOpacity>
                </View>
            </View>
            {/* Annonces overlay supprimé - maintenant dans l'onglet dédié */}

            {/* Notification Detail Overlay - MOVED HERE for z-index */}
            {
                selectedNotification && (
                    <Animated.View style={[styles.detailOverlay, { opacity: fadeAnim, zIndex: 1000 }]}>
                        <SafeAreaView style={styles.detailContainer}>
                            <TouchableOpacity style={styles.backButton} onPress={closeNotification}>
                                <ArrowLeft size={24} color="#1e293b" />
                                <Text style={styles.backButtonText}>Retour</Text>
                            </TouchableOpacity>

                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                                <View style={styles.detailCard}>
                                    <Text style={styles.detailDate}>
                                        {new Date(selectedNotification.date).toLocaleDateString('fr-FR', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        }).replace(':', 'h')}
                                    </Text>
                                    <Text style={styles.detailTitle}>{selectedNotification.title}</Text>

                                    {selectedNotification.author && (
                                        <View style={styles.detailAuthorContainer}>
                                            <View style={styles.authorAvatar}>
                                                <Text style={styles.authorInitial}>{selectedNotification.author.charAt(0)}</Text>
                                            </View>
                                            <View>
                                                <Text style={styles.authorLabel}>ÉMETTEUR</Text>
                                                <Text style={styles.detailAuthorName}>{selectedNotification.author}</Text>
                                            </View>
                                        </View>
                                    )}

                                    <View style={styles.detailDivider} />
                                    <Text style={styles.detailDescription}>
                                        {selectedNotification.content || selectedNotification.description}
                                    </Text>
                                </View>
                            </ScrollView>
                        </SafeAreaView>
                    </Animated.View>
                )
            }

            {/* Modal d'inscription aux cours */}
            <Modal
                visible={showEnrollmentModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowEnrollmentModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.enrollModalContent}>
                        <View style={styles.modalHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.modalTitle}>Inscription aux cours</Text>
                                <Text style={styles.modalSubtitle}>Sélectionnez les matières à ajouter</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.modalCloseBtn}
                                onPress={() => setShowEnrollmentModal(false)}
                            >
                                <Plus size={24} color="#64748b" style={{ transform: [{ rotate: '45deg' }] }} />
                            </TouchableOpacity>
                        </View>

                        {isLoadingAvailable ? (
                            <ActivityIndicator size="large" color="#0d9488" style={{ marginVertical: 40 }} />
                        ) : availableCourses.length > 0 ? (
                            <FlatList
                                data={availableCourses}
                                keyExtractor={item => item.id}
                                contentContainerStyle={{ paddingBottom: 20 }}
                                renderItem={({ item }) => (
                                    <View style={styles.availableCourseCard}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.availableCourseName}>{item.name}</Text>
                                            <Text style={styles.availableCourseProf}>{item.professor}</Text>
                                            <View style={[styles.levelTag, item.level === "Niveau inférieur" && { backgroundColor: '#fff7ed' }]}>
                                                <Text style={[styles.levelTagText, item.level === "Niveau inférieur" && { color: '#f97316' }]}>{item.level}</Text>
                                            </View>
                                        </View>
                                        <TouchableOpacity
                                            style={[styles.enrollActionBtn, isEnrolling && { opacity: 0.5 }]}
                                            onPress={() => handleEnroll(item.code)}
                                            disabled={isEnrolling}
                                        >
                                            {isEnrolling ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.enrollActionBtnText}>M'inscrire</Text>}
                                        </TouchableOpacity>
                                    </View>
                                )}
                            />
                        ) : (
                            <View style={styles.emptyAvailable}>
                                <BookOpen size={48} color="#cbd5e1" strokeWidth={1} />
                                <Text style={styles.emptyAvailableText}>Aucun nouveau cours disponible pour le moment.</Text>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

            {AdManagerModal()}

            {/* Ecran Progression Globale */}
            {showGlobalAttendance && (
                <GlobalAttendanceScreen
                    onClose={() => setShowGlobalAttendance(false)}
                    attendance={dashboardData?.stats?.attendance ?? 0}
                    courses={coursesData}
                    studentName={dashboardData?.student?.name}
                    attendanceHistory={dashboardData?.recentAttendance || []}
                />
            )}
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#0f766e',
        borderBottomLeftRadius: 35,
        borderBottomRightRadius: 35,
        zIndex: 100,
        overflow: 'hidden',
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: Platform.OS === 'ios' ? 20 : 40,
        paddingHorizontal: 20,
    },
    userInfo: {
        flex: 1,
    },
    greeting: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
    },
    userName: {
        color: 'white',
        fontSize: 32,
        fontWeight: '900',
        marginVertical: 2,
    },
    userClass: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
        fontWeight: '600',
    },
    connectionBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    connectionIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 20,
        gap: 4,
    },
    connectionText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    refreshBadge: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    refreshText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
    },
    inlineRefresh: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        backgroundColor: '#ffffff',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 25,
        marginBottom: 20,
        // Ombre douce style iOS
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    inlineRefreshText: {
        marginLeft: 8,
        color: '#64748b',
        fontSize: 13,
        fontWeight: '600',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 14,
        paddingHorizontal: 12,
        height: 44,
        width: 130,
    },
    searchInput: {
        flex: 1,
        color: 'white',
        fontSize: 14,
        marginLeft: 8,
    },
    logoutIcon: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 12,
        borderRadius: 14,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 120,
        paddingTop: Platform.OS === 'ios' ? 220 : 200,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    notificationsCard: {
        // Full width implicitly
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    cardTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    bellIconContainer: {
        backgroundColor: '#f0fdfa',
        padding: 8,
        borderRadius: 10,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
    },
    cardHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    markReadButton: {
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    markReadText: {
        color: '#0d9488',
        fontSize: 12,
        fontWeight: '600',
    },
    newBadge: {
        backgroundColor: '#ef4444',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    newBadgeText: {
        color: 'white',
        fontSize: 11,
        fontWeight: 'bold',
    },
    notificationsList: {
        gap: 12,
    },
    notifItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 18,
        gap: 12,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    notifItemRead: {
        backgroundColor: '#f8fafc',
        opacity: 0.8,
    },
    notifStatusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#0d9488',
        position: 'absolute',
        top: 15,
        left: 8,
    },
    notifContent: {
        flex: 1,
    },
    notifTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 4,
    },
    notifTitleRead: {
        fontWeight: '500',
        color: '#64748b',
    },
    notifDesc: {
        fontSize: 13,
        color: '#64748b',
        lineHeight: 18,
        marginBottom: 6,
    },
    notifDate: {
        fontSize: 11,
        color: '#94a3b8',
        fontWeight: '500',
    },
    presenceCard: {
        marginTop: 30,
    },
    presenceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        gap: 12,
    },
    syncBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fffbeb',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 'auto',
        borderWidth: 1,
        borderColor: '#fef3c7',
    },
    syncBadgeText: {
        fontSize: 11,
        color: '#d97706',
        fontWeight: '700',
    },
    qrIconSmallContainer: {
        backgroundColor: '#f0fdfa',
        padding: 8,
        borderRadius: 10,
    },
    presenceTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
    },
    qrButton: {
        backgroundColor: '#0d9488',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 18,
        gap: 12,
        shadowColor: '#0d9488',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 6,
    },
    qrButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    detailOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'white',
        zIndex: 100,
    },
    detailContainer: {
        flex: 1,
        padding: 20,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
        gap: 10,
        padding: 10,
    },
    backButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1e293b',
    },
    detailCard: {
        padding: 20,
        borderRadius: 30,
        backgroundColor: 'white',
    },
    detailDate: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 10,
        fontWeight: '600',
    },
    detailTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#1e293b',
        lineHeight: 34,
    },
    detailAuthorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 15,
        backgroundColor: '#f0fdfa',
        padding: 12,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#ccfbf1',
    },
    authorAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#0d9488',
        alignItems: 'center',
        justifyContent: 'center',
    },
    authorInitial: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    authorLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94a3b8',
        letterSpacing: 1,
    },
    detailAuthorName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1e293b',
    },
    authorBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginBottom: 4,
    },
    authorBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#0d9488',
        textTransform: 'uppercase',
    },
    detailDivider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        width: '100%',
        marginVertical: 25,
    },
    detailDescription: {
        fontSize: 18,
        color: '#334155',
        lineHeight: 28,
    },
    // Nouvelles sections styles
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        marginTop: 10,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1e293b',
    },
    seeAllText: {
        color: '#0d9488',
        fontSize: 14,
        fontWeight: '600',
    },
    statsList: {
        marginBottom: 25,
        marginHorizontal: -20,
        paddingHorizontal: 20,
    },
    // Styles pour la présence globale (Style Site Web)
    globalAttendanceCard: {
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: 20,
        elevation: 4,
        shadowColor: '#0d9488',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
    },
    globalAttendanceGradient: {
        padding: 20,
    },
    globalAttendanceContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    globalAttendanceLabel: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    globalAttendanceStatus: {
        color: 'white',
        fontSize: 18,
        fontWeight: '900',
        marginTop: 2,
    },
    globalAttendanceCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    globalAttendanceValue: {
        color: 'white',
        fontSize: 18,
        fontWeight: '900',
    },
    statCard: {
        backgroundColor: 'white',
        borderRadius: 22,
        padding: 16,
        width: 140,
        marginRight: 15,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    progressCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 4,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    statPercentage: {
        fontSize: 18,
        fontWeight: '900',
    },
    statCourseName: {
        fontSize: 13,
        fontWeight: '700',
        color: '#334155',
        marginBottom: 4,
        textAlign: 'center',
        width: '100%',
    },
    statDetails: {
        fontSize: 11,
        color: '#94a3b8',
        fontWeight: '500',
    },
    historyCard: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 5,
        marginBottom: 25,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f8fafc',
    },
    historyStatusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 12,
    },
    historyMainInfo: {
        flex: 1,
    },
    historyCourse: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 2,
    },
    historyDate: {
        fontSize: 12,
        color: '#94a3b8',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    // Styles pour les détails du cours
    courseHeaderDetail: {
        alignItems: 'center',
        marginVertical: 20,
    },
    courseIconDetail: {
        width: 60,
        height: 60,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    courseTitleDetail: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1e293b',
        textAlign: 'center',
    },
    courseSubtitleDetail: {
        fontSize: 14,
        color: '#94a3b8',
        marginTop: 5,
    },
    // Styles pour l'avatar sur Home
    homeAvatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 15,
    },
    homeAvatarImage: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 2,
        borderColor: 'white',
    },
    homeAvatarPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
    },
    homeAvatarBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#0d9488',
        width: 14,
        height: 14,
        borderRadius: 7,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'white',
    },
    statsOverview: {
        flexDirection: 'row',
        backgroundColor: '#f8fafc',
        borderRadius: 24,
        padding: 20,
        marginVertical: 25,
        alignItems: 'center',
    },
    statMetric: {
        flex: 1,
        alignItems: 'center',
    },
    metricValue: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1e293b',
    },
    metricLabel: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 4,
        fontWeight: '600',
    },
    metricDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#e2e8f0',
    },
    sessionHistoryTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 15,
    },
    sessionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 18,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    sessionMain: {
        gap: 2,
    },
    sessionDate: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1e293b',
    },
    sessionTime: {
        fontSize: 13,
        color: '#94a3b8',
    },
    sessionRight: {
        alignItems: 'flex-end',
        gap: 6,
    },
    sessionPoints: {
        fontSize: 14,
        fontWeight: '800',
    },
    // Styles pour les pages complètes
    fullPageTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#1e293b',
        paddingHorizontal: 10,
    },
    fullPageSubtitle: {
        fontSize: 15,
        color: '#64748b',
        paddingHorizontal: 10,
        marginBottom: 25,
        marginTop: 5,
    },
    fullListScroll: {
        flex: 1,
    },
    fullStatCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(241, 245, 249, 0.5)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    fullStatIcon: {
        width: 50,
        height: 50,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    fullStatInfo: {
        flex: 1,
    },
    fullStatName: {
        fontSize: 16,
        fontWeight: '800',
    },
    fullStatProgressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    fullProgressBarBg: {
        flex: 1,
        height: 12,
        borderRadius: 6,
        overflow: 'hidden',
    },
    fullProgressBarFill: {
        height: '100%',
        borderRadius: 6,
        justifyContent: 'center',
    },
    progressBarGlow: {
        width: '100%',
        height: '40%',
        backgroundColor: 'rgba(255,255,255,0.2)',
        position: 'absolute',
        top: 0,
    },
    percentBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    fullStatPercent: {
        fontSize: 12,
        fontWeight: '900',
    },
    statMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    sessionBadge: {
        backgroundColor: '#fff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    sessionBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    fullHistoryItem: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 18,
        marginBottom: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    fullHistorySideLine: {
        width: 4,
        height: '100%',
    },
    fullHistoryContent: {
        flex: 1,
        padding: 16,
    },
    fullHistoryCourse: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 8,
    },
    fullHistoryMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    fullHistoryDate: {
        fontSize: 13,
        color: '#94a3b8',
    },
    // Styles pour les nouveaux onglets
    tabContent: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    tabScrollPadding: {
        padding: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 50,
        paddingBottom: 100,
    },
    tabTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#1e293b',
    },
    tabSubtitle: {
        fontSize: 15,
        color: '#64748b',
        marginBottom: 25,
        marginTop: 5,
    },
    // Styles Onglet Cours
    courseRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 15,
        marginBottom: 22,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    courseColorBar: {
        width: 4,
        height: 35,
        borderRadius: 2,
        marginRight: 15,
    },
    courseRowInfo: {
        flex: 1,
    },
    userNameHeader: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        marginTop: 4,
        maxWidth: '90%',
    },
    courseRowName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 2,
    },
    courseRowMeta: {
        fontSize: 12,
        color: '#94a3b8',
    },
    // Styles Onglet Planning
    scheduleDayBlock: {
        marginBottom: 25,
    },
    scheduleDayTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0d9488',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
        marginLeft: 5,
    },
    scheduleSession: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 18,
        padding: 15,
        marginBottom: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    scheduleTimeContainer: {
        width: 60,
        borderRightWidth: 1,
        borderRightColor: '#f1f5f9',
        marginRight: 15,
    },
    scheduleTime: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1e293b',
    },
    scheduleCourseContainer: {
        flex: 1,
    },
    scheduleCourseName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1e293b',
    },
    scheduleTimeSub: {
        fontSize: 12,
        color: '#94a3b8',
        marginTop: 2,
    },
    // Styles Onglet Profil
    profileHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        width: '100%',
    },
    profileEditToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0fdfa',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 6,
        borderWidth: 1,
        borderColor: '#ccfbf1',
    },
    profileEditToggleCancel: {
        backgroundColor: '#fef2f2',
        borderColor: '#fee2e2',
    },
    profileEditToggleText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0d9488',
    },
    profileEditToggleTextCancel: {
        color: '#ef4444',
    },

    profileHeader: {
        alignItems: 'center',
        marginBottom: 30,
    },
    profileAvatarBig: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#0d9488',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
        position: 'relative',
        overflow: 'hidden',
    },
    profileAvatarImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    editPhotoBadge: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: '#0d9488',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    profileName: {
        fontSize: 24,
        fontWeight: '900',
        color: '#1e293b',
    },
    profileClass: {
        fontSize: 15,
        color: '#64748b',
        marginTop: 4,
    },
    profileInfoCard: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 20,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    profileInfoItem: {
        paddingVertical: 12,
    },
    profileInfoLabel: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    profileInfoValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
    },
    profileInfoDivider: {
        height: 1,
        backgroundColor: '#f1f5f9',
    },
    // Styles pour les notifs de cours
    courseNotifsList: {
        marginBottom: 10,
    },
    courseNotifItem: {
        backgroundColor: '#f8fafc',
        padding: 15,
        borderRadius: 15,
        marginBottom: 10,
        borderLeftWidth: 4,
    },
    courseNotifTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 4,
    },
    courseNotifDesc: {
        fontSize: 13,
        color: '#475569',
        lineHeight: 18,
        marginBottom: 6,
    },
    courseNotifDate: {
        fontSize: 11,
        color: '#94a3b8',
    },
    noNotifText: {
        fontSize: 14,
        color: '#94a3b8',
        fontStyle: 'italic',
        textAlign: 'center',
        marginVertical: 10,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fef2f2',
        padding: 18,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#fee2e2',
        marginTop: 20,
        marginBottom: 40,
        gap: 10,
    },
    logoutButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#ef4444',
    },
    scheduleProf: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 4,
        fontStyle: 'italic',
    },
    mainContent: {
        flex: 1,
    },
    profileEditRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 5,
    },
    sexOption: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    sexOptionActive: {
        backgroundColor: '#0d9488',
        borderColor: '#0d9488',
    },
    sexOptionText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748b',
    },
    sexOptionTextActive: {
        color: 'white',
    },
    profileInput: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
        backgroundColor: '#f1f5f9',
        padding: 12,
        borderRadius: 12,
        marginTop: 5,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    profileInputDisabled: {
        backgroundColor: '#f8fafc',
        borderColor: '#f1f5f9',
        color: '#94a3b8',
    },
    saveProfileButton: {
        backgroundColor: '#0d9488',
        padding: 15,
        borderRadius: 15,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 10,
    },
    saveProfileButtonText: {
        color: 'white',
        fontWeight: '800',
        fontSize: 15,
    },
    profileInputText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    countryModalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        height: '70%',
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 10,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#1e293b',
    },
    modalCloseText: {
        color: '#0d9488',
        fontWeight: '700',
        fontSize: 16,
    },
    countryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingHorizontal: 10,
    },
    countryFlag: {
        fontSize: 24,
        marginRight: 15,
    },
    countryName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        flex: 1,
    },
    // Styles pour les états vides
    emptyStateContainer: {
        width: width - 40,
        backgroundColor: '#f8fafc',
        borderRadius: 24,
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#f1f5f9',
        borderStyle: 'dashed',
    },
    emptyStateIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyStateText: {
        fontSize: 16,
        color: '#94a3b8',
        fontWeight: '600',
        textAlign: 'center',
    },
    // Missing Modal Styles
    adminModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        marginBottom: 20,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748b',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    // Styles pour les Publicités - Canva Inspiré
    adCarouselContainer: {
        marginVertical: 20,
        width: width,
        // Pas de paddingHorizontal ou marginHorizontal
    },
    adScrollView: {
        // No padding - cards handle their own spacing
    },
    adCard: {
        backgroundColor: '#000',
        borderRadius: 28,
        overflow: 'hidden',
        height: 250, // Augmenté de 220 à 250
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
    adBannerWrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    adFullImage: {
        width: '100%',
        height: '100%',
    },
    adOverlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '80%', // Monté un peu plus pour couvrir plus de texte
    },
    adImagePlaceholderFull: {
        width: '100%',
        height: '100%',
        backgroundColor: '#1e293b',
        justifyContent: 'center',
        alignItems: 'center',
    },
    adContentContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        height: '100%',
        justifyContent: 'flex-end',
        paddingBottom: 25, // Plus d'espace en bas pour le bouton
    },
    adBadgeTopRight: {
        position: 'absolute',
        top: 15,
        right: 15,
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        zIndex: 10,
    },
    adBadgeText: {
        color: '#000',
        fontSize: 10,
        fontFamily: 'Inter-Black',
        letterSpacing: 1,
    },
    adCanvaTitle: {
        color: 'white',
        fontSize: 20, // Réduit de 24 à 20 pour éviter l'encombrement
        fontFamily: 'Inter-Black',
        marginBottom: 6,
        lineHeight: 24,
    },
    adCanvaDesc: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 13,
        fontFamily: 'Inter-Medium',
        marginBottom: 15,
        lineHeight: 18,
    },
    adCanvaButton: {
        backgroundColor: '#00875F', // Vert Unilu
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 30,
        alignSelf: 'flex-start',
        marginTop: 5,
    },
    adCanvaButtonText: {
        color: 'white',
        fontFamily: 'Inter-Bold',
        fontSize: 14,
    },
    adDots: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 15,
        alignItems: 'center',
    },
    adDot: {
        height: 6,
        borderRadius: 3,
        marginHorizontal: 3,
    },
    adDotActive: {
        width: 24, // Barre allongée
        backgroundColor: '#059669',
    },
    adDotInactive: {
        width: 6,
        backgroundColor: '#cbd5e1',
    },

    // Styles pour la barre de navigation
    tabBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 25 : 15,
        backgroundColor: 'rgba(248, 250, 252, 0.95)',
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 25,
        height: 70,
        alignItems: 'center',
        justifyContent: 'space-around',
        // Ombre premium
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    tabItem: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        height: '100%',
    },
    tabLabel: {
        fontSize: 10,
        color: '#94a3b8',
        fontWeight: '700',
        marginTop: 4,
    },
    tabLabelActive: {
        color: '#0d9488',
    },
    tabIndicator: {
        position: 'absolute',
        bottom: 8,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#0d9488',
    },
    fullPageHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    markAllReadButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#f0fdfa',
        borderRadius: 10,
    },
    fullNotifItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    fullNotifIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        position: 'relative',
    },
    fullNotifDot: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#0d9488',
    },
    fullNotifContent: {
        flex: 1,
    },
    fullNotifTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 4,
    },
    fullNotifTitleRead: {
        fontWeight: '600',
        color: '#64748b',
    },
    fullNotifDesc: {
        fontSize: 13,
        color: '#64748b',
        lineHeight: 18,
        marginBottom: 6,
    },
    fullNotifDate: {
        fontSize: 11,
        color: '#94a3b8',
    },
    emptyFullState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 100,
    },
    // Ad Admin Styles
    modalSubtitle: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 2,
    },
    adFormCard: {
        padding: 20,
        gap: 15,
    },
    imagePickerBtn: {
        width: '100%',
        height: 180,
        backgroundColor: '#f8fafc',
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#e2e8f0',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    pickedImage: {
        width: '100%',
        height: '100%',
    },
    pickerPlaceholder: {
        alignItems: 'center',
        gap: 10,
    },
    pickerText: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '600',
    },
    adminInput: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        color: '#1e293b',
    },
    notifyConfig: {
        backgroundColor: '#f0fdf4',
        padding: 16,
        borderRadius: 18,
        gap: 10,
        borderWidth: 1,
        borderColor: '#dcfce7',
    },
    smallLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#166534',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    btnGroup: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 10,
    },
    btn: {
        flex: 1,
        height: 54,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    btnCancel: {
        backgroundColor: '#f1f5f9',
    },
    btnSubmit: {
        backgroundColor: '#0d9488',
    },
    btnTextCancel: {
        color: '#64748b',
        fontWeight: 'bold',
    },
    btnTextSubmit: {
        color: 'white',
        fontWeight: 'bold',
    },
    addNewBtn: {
        backgroundColor: '#0d9488',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 18,
        gap: 10,
        marginBottom: 24,
    },
    addNewBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    adminAdCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 12,
        flexDirection: 'row',
        gap: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    adminAdThumb: {
        width: 80,
        height: 80,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
    },
    adminAdInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    adminAdTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
    },
    quotaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
    },
    quotaBarBg: {
        flex: 1,
        height: 6,
        backgroundColor: '#f1f5f9',
        borderRadius: 3,
        overflow: 'hidden',
    },
    quotaBarFill: {
        height: '100%',
        backgroundColor: '#0d9488',
    },
    adminAdStats: {
        fontSize: 11,
        fontWeight: '700',
        color: '#64748b',
        minWidth: 35,
    },
    adminAdActions: {
        flexDirection: 'row',
        gap: 10,
    },
    actionBtnNotify: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0d9488',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        gap: 5,
    },
    actionBtnDelete: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#fee2e2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionBtnText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    emptyAdsContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        gap: 10,
    },
    emptyText: {
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: '600',
    },
    // Status Badge Styles
    statusBadgeSmall: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    statusBadgeTextSmall: {
        color: 'white',
        fontSize: 8,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    statFooterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 5,
        width: '100%',
    },
    statProgressLabel: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    // Enrollment & Unenrollment Styles
    enrollOpenBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0d9488',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 14,
        gap: 8,
    },
    enrollOpenBtnText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    cautionSection: {
        paddingHorizontal: 5,
    },
    unenrollTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 15,
        backgroundColor: '#fef2f2',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#fee2e2',
    },
    unenrollTriggerText: {
        color: '#ef4444',
        fontSize: 15,
        fontWeight: '700',
    },
    unenrollConfirmCard: {
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#fee2e2',
        elevation: 2,
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    cautionIconContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    cautionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#ef4444',
    },
    cautionText: {
        fontSize: 14,
        color: '#475569',
        lineHeight: 22,
        marginBottom: 20,
    },
    cautionInput: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 14,
        color: '#1e293b',
        marginBottom: 20,
    },
    cautionActions: {
        flexDirection: 'row',
        gap: 12,
    },
    cautionCancel: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 15,
        backgroundColor: '#f1f5f9',
    },
    cautionCancelText: {
        color: '#64748b',
        fontSize: 14,
        fontWeight: '700',
    },
    cautionConfirm: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 15,
        backgroundColor: '#ef4444',
    },
    cautionConfirmText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '800',
    },
    // Enrollment Modal Styles
    enrollModalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
        minHeight: height * 0.7,
        maxHeight: height * 0.9,
        padding: 24,
    },
    modalCloseBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    availableCourseCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 22,
        padding: 20,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    availableCourseName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1e293b',
        marginBottom: 4,
    },
    availableCourseProf: {
        fontSize: 13,
        color: '#64748b',
        marginBottom: 8,
    },
    levelTag: {
        alignSelf: 'flex-start',
        backgroundColor: '#f0fdfa',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    levelTagText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#0d9488',
        textTransform: 'uppercase',
    },
    enrollActionBtn: {
        backgroundColor: '#0d9488',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        minWidth: 90,
        alignItems: 'center',
    },
    enrollActionBtnText: {
        color: 'white',
        fontSize: 13,
        fontWeight: 'bold',
    },
    emptyAvailable: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        gap: 15,
    },
    emptyAvailableText: {
        color: '#94a3b8',
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        maxWidth: 250,
    },
    // Styles pour les Annonces
    announcementsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        gap: 16,
    },
    announcementsIconBig: {
        width: 56,
        height: 56,
        borderRadius: 18,
        backgroundColor: '#f0fdfa',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    announcementsBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#ef4444',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'white',
        paddingHorizontal: 4,
    },
    announcementsBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '800',
    },
    emptyAnnouncementsState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    emptyAnnouncementsText: {
        color: '#1e293b',
        fontSize: 18,
        fontWeight: '700',
        marginTop: 20,
    },
    emptyAnnouncementsSubText: {
        color: '#94a3b8',
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
    tabBadge: {
        position: 'absolute',
        top: -6,
        right: -10,
        backgroundColor: '#ef4444',
        borderRadius: 9,
        minWidth: 18,
        height: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: 'white',
        paddingHorizontal: 3,
    },
    tabBadgeText: {
        color: 'white',
        fontSize: 9,
        fontWeight: '900',
    },
});
