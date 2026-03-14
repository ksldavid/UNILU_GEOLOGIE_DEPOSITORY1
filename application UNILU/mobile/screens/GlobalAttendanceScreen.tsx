import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity,
    SafeAreaView, Platform, ScrollView, StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, CheckCircle, AlertCircle, XCircle, Star, ChevronDown } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

// ─── CONFIG EMOJIS PAR ZONE ───────────────────────────────────────────────────
const ZONE_CONFIG = {
    celebrate: {
        emojis: ['🎉', '🌟', '🏆', '✨', '🎊'],
        confettiColors: ['#0d9488', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#ec4899', '#f97316', '#14b8a6'],
        useConfetti: true,
    },
    passable: {
        emojis: ['😐', '🤨', '🥱'],
        confettiColors: [],
        useConfetti: false,
    },
    worried: {
        emojis: ['🚩', '🥲', '😶‍🌫️'],
        confettiColors: [],
        useConfetti: false,
    },
    critical: {
        emojis: ['📢', '🚨', '😱'],
        confettiColors: [],
        useConfetti: false,
    },
};

const PARTICLE_COUNT = 40;
const HISTORY_PAGE_SIZE = 10;

// ─── INTERFACES ───────────────────────────────────────────────────────────────
interface EmojiParticle {
    id: number;
    x: Animated.Value;
    y: Animated.Value;
    rotation: Animated.Value;
    scale: Animated.Value;
    opacity: Animated.Value;
    emoji: string;
    fontSize: number;
    initialX: number;
}

interface ConfettiParticle {
    id: number;
    x: Animated.Value;
    y: Animated.Value;
    rotation: Animated.Value;
    opacity: Animated.Value;
    color: string;
    size: number;
    shape: 'square' | 'circle' | 'rect';
    initialX: number;
}

interface CourseStats {
    id: string;
    name: string;
    percentage: number;
    attendedCount?: number;
    totalCount?: number;
    status?: string;
    color?: string;
}

interface AttendanceRecord {
    id: string;
    courseName: string;
    date: string;
    time?: string;
    status: string;
}

interface GlobalAttendanceScreenProps {
    onClose: () => void;
    attendance: number;
    courses: CourseStats[];
    studentName?: string;
    attendanceHistory?: AttendanceRecord[];
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────
export function GlobalAttendanceScreen({
    onClose, attendance, courses, studentName, attendanceHistory = []
}: GlobalAttendanceScreenProps) {

    const [particles, setParticles] = useState<EmojiParticle[]>([]);
    const [confettiParticles, setConfettiParticles] = useState<ConfettiParticle[]>([]);
    const [animating, setAnimating] = useState(false);
    const [showAllHistory, setShowAllHistory] = useState(false);

    const fadeIn = useRef(new Animated.Value(0)).current;
    const slideUp = useRef(new Animated.Value(50)).current;

    const getZone = (): keyof typeof ZONE_CONFIG => {
        if (attendance >= 75) return 'celebrate';
        if (attendance >= 50) return 'passable';
        if (attendance >= 25) return 'worried';
        return 'critical';
    };

    const zone = getZone();
    const config = ZONE_CONFIG[zone];

    // ── Lancer pluie d'emojis ────────────────────────────────────────────────
    const launchAnimation = useCallback(() => {
        if (animating) return;
        setAnimating(true);

        const newParticles: EmojiParticle[] = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
            const initialX = Math.random() * (width - 50);
            return {
                id: Date.now() + i,
                x: new Animated.Value(initialX),
                y: new Animated.Value(-60 - Math.random() * 200),
                rotation: new Animated.Value(0),
                scale: new Animated.Value(0.6 + Math.random() * 0.7),
                opacity: new Animated.Value(1),
                emoji: config.emojis[Math.floor(Math.random() * config.emojis.length)],
                fontSize: 20 + Math.random() * 20,
                initialX,
            };
        });

        const newConfetti: ConfettiParticle[] = config.useConfetti
            ? Array.from({ length: 40 }, (_, i) => {
                const initialX = Math.random() * width;
                return {
                    id: Date.now() + 1000 + i,
                    x: new Animated.Value(initialX),
                    y: new Animated.Value(-30 - Math.random() * 150),
                    rotation: new Animated.Value(0),
                    opacity: new Animated.Value(1),
                    color: config.confettiColors[Math.floor(Math.random() * config.confettiColors.length)],
                    size: 6 + Math.random() * 9,
                    shape: (['square', 'circle', 'rect'] as const)[Math.floor(Math.random() * 3)],
                    initialX,
                };
            })
            : [];

        setParticles(newParticles);
        setConfettiParticles(newConfetti);

        const emojiAnims = newParticles.map((p) => {
            const delay = Math.random() * 700;
            const duration = 2200 + Math.random() * 1500;
            const swayX = (Math.random() - 0.5) * 100 + p.initialX;
            return Animated.parallel([
                Animated.timing(p.y, { toValue: height + 60, duration, delay, useNativeDriver: true }),
                Animated.timing(p.x, { toValue: swayX, duration, delay, useNativeDriver: true }),
                Animated.timing(p.rotation, {
                    toValue: (Math.random() > 0.5 ? 1 : -1) * (120 + Math.random() * 180),
                    duration, delay, useNativeDriver: true,
                }),
                Animated.sequence([
                    Animated.delay(delay + duration - 500),
                    Animated.timing(p.opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
                ]),
            ]);
        });

        const confettiAnims = newConfetti.map((c) => {
            const delay = Math.random() * 500;
            const duration = 2000 + Math.random() * 1800;
            const swayX = (Math.random() - 0.5) * 200 + c.initialX;
            return Animated.parallel([
                Animated.timing(c.y, { toValue: height + 40, duration, delay, useNativeDriver: true }),
                Animated.timing(c.x, { toValue: swayX, duration, delay, useNativeDriver: true }),
                Animated.timing(c.rotation, { toValue: 720 + Math.random() * 720, duration, delay, useNativeDriver: true }),
                Animated.sequence([
                    Animated.delay(delay + duration - 500),
                    Animated.timing(c.opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
                ]),
            ]);
        });

        Animated.parallel([...emojiAnims, ...confettiAnims]).start(() => setAnimating(false));
    }, [animating, config]);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeIn, { toValue: 1, duration: 350, useNativeDriver: true }),
            Animated.spring(slideUp, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
        ]).start();
        setTimeout(() => launchAnimation(), 450);
    }, []);

    // ── Helpers ───────────────────────────────────────────────────────────────
    const getAttendanceColor = (pct: number) => {
        if (pct >= 75) return '#10b981';
        if (pct >= 50) return '#f59e0b';
        if (pct >= 25) return '#f97316';
        return '#ef4444';
    };

    const getGradientColors = (): [string, string] => {
        if (attendance >= 75) return ['#0d9488', '#0f766e'];
        if (attendance >= 50) return ['#f59e0b', '#d97706'];
        if (attendance >= 25) return ['#f97316', '#c2410c'];
        return ['#ef4444', '#991b1b'];
    };

    const getStatusInfo = (status: string) => {
        switch (status.toLowerCase()) {
            case 'present':  return { label: 'Présent', color: '#10b981', bgColor: '#ecfdf5', dot: '🟢' };
            case 'late':     return { label: 'En retard', color: '#f59e0b', bgColor: '#fffbe6', dot: '🟡' };
            case 'absent':   return { label: 'Absent', color: '#ef4444', bgColor: '#fef2f2', dot: '🔴' };
            case 'excused':  return { label: 'Excusé', color: '#6366f1', bgColor: '#eef2ff', dot: '🔵' };
            default:         return { label: 'Inconnu', color: '#94a3b8', bgColor: '#f8fafc', dot: '⚪' };
        }
    };

    const getGradeInfo = () => {
        if (attendance >= 90)  return { label: 'Excellence', emoji: '🏆', banner: '🎉 Félicitations ! Tu es un modèle d\'assiduité. Garde ce rythme !', bannerBg: '#f0fdf4', bannerBorder: '#bbf7d0', bannerText: '#065f46' };
        if (attendance >= 75)  return { label: 'Très Bien',  emoji: '🌟', banner: '🌟 Excellent travail ! Ta régularité est exemplaire. Continue !', bannerBg: '#f0fdf4', bannerBorder: '#bbf7d0', bannerText: '#065f46' };
        if (attendance >= 50)  return { label: 'Passable',   emoji: '😐', banner: '🤨 Ta présence est passable. Avec plus d\'effort, tu peux largement progresser !', bannerBg: '#fffbeb', bannerBorder: '#fde68a', bannerText: '#78350f' };
        if (attendance >= 25)  return { label: 'Préoccupant', emoji: '🚩', banner: '🥲 Ta présence est inquiétante. Un effort sérieux est nécessaire avant qu\'il ne soit trop tard.', bannerBg: '#fff7ed', bannerBorder: '#fed7aa', bannerText: '#7c2d12' };
        return { label: 'Critique', emoji: '🚨', banner: '😱 DANGER ! Ta présence est très mauvaise. Tu risques ton année académique. Agis maintenant !', bannerBg: '#fef2f2', bannerBorder: '#fecaca', bannerText: '#7f1d1d' };
    };

    const grade = getGradeInfo();
    const gradColors = getGradientColors();

    // Tri historique : plus récent en premier
    const sortedHistory = [...attendanceHistory].sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
    });
    const visibleHistory = showAllHistory ? sortedHistory : sortedHistory.slice(0, HISTORY_PAGE_SIZE);

    // Tri cours : meilleur taux de présence au pire
    const sortedCourses = [...courses].sort((a, b) => {
        const pctA = a.percentage ?? 0;
        const pctB = b.percentage ?? 0;
        return pctB - pctA;
    });

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <Animated.View style={[styles.container, { opacity: fadeIn }]}>
            <StatusBar barStyle="light-content" />

            {/* ── Emojis tombants ── */}
            {particles.map((p) => {
                const rotate = p.rotation.interpolate({ inputRange: [-360, 0, 360], outputRange: ['-360deg', '0deg', '360deg'] });
                return (
                    <Animated.Text
                        key={p.id}
                        pointerEvents="none"
                        style={[styles.emojiParticle, {
                            fontSize: p.fontSize,
                            transform: [{ translateX: p.x }, { translateY: p.y }, { rotate }, { scale: p.scale }],
                            opacity: p.opacity,
                        }]}
                    >
                        {p.emoji}
                    </Animated.Text>
                );
            })}

            {/* ── Formes confetti (celebrate uniquement) ── */}
            {confettiParticles.map((c) => {
                const rotate = c.rotation.interpolate({ inputRange: [0, 720], outputRange: ['0deg', '720deg'] });
                return (
                    <Animated.View
                        key={c.id}
                        pointerEvents="none"
                        style={[styles.confettoShape, {
                            transform: [{ translateX: c.x }, { translateY: c.y }, { rotate }],
                            opacity: c.opacity,
                            backgroundColor: c.color,
                            width: c.shape === 'rect' ? c.size * 0.5 : c.size,
                            height: c.shape === 'rect' ? c.size * 1.8 : c.size,
                            borderRadius: c.shape === 'circle' ? c.size / 2 : 2,
                        }]}
                    />
                );
            })}

            <SafeAreaView style={styles.safeArea}>
                {/* ── Header ── */}
                <View style={[styles.header, { backgroundColor: gradColors[1] }]}>
                    <TouchableOpacity onPress={onClose} style={styles.backBtn}>
                        <ArrowLeft size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Ma Progression</Text>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <Animated.View style={{ transform: [{ translateY: slideUp }] }}>

                        {/* ── Carte principale ── */}
                        <View style={[styles.mainCard, { shadowColor: gradColors[0] }]}>
                            <LinearGradient colors={gradColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.mainCardGradient}>
                                <View style={styles.gradeBadge}>
                                    <Text style={styles.gradeEmoji}>{grade.emoji}</Text>
                                    <Text style={styles.gradeLabel}>{grade.label}</Text>
                                </View>
                                <View style={styles.bigCircleOuter}>
                                    <View style={styles.bigCircleInner}>
                                        <Text style={styles.bigPercentage}>{attendance}%</Text>
                                        <Text style={styles.bigPercentageLabel}>présence</Text>
                                    </View>
                                </View>
                                <Text style={styles.congratsText}>
                                    {attendance >= 90 ? `Incroyable ${studentName?.split(' ')[0] || ''} ! Tu es un modèle. 🏆`
                                        : attendance >= 75 ? `Excellent ${studentName?.split(' ')[0] || ''} ! Continue ! 💪`
                                        : attendance >= 50 ? `${studentName?.split(' ')[0] || ''}, tu peux mieux faire ! 😐`
                                        : attendance >= 25 ? `${studentName?.split(' ')[0] || ''}, ta présence inquiète ! 🚩`
                                        : `Situation critique ${studentName?.split(' ')[0] || ''} ! 🚨`}
                                </Text>
                            </LinearGradient>
                        </View>

                        {/* ── Bannière contextuelle ── */}
                        <View style={[styles.bannerCard, { backgroundColor: grade.bannerBg, borderColor: grade.bannerBorder }]}>
                            <Text style={[styles.bannerText, { color: grade.bannerText }]}>{grade.banner}</Text>
                        </View>

                        {/* ── SUIVI DE PRÉSENCE ── */}
                        <Text style={styles.sectionTitle}>Suivi de présence</Text>

                        {sortedHistory.length > 0 ? (
                            <>
                                {visibleHistory.map((record, idx) => {
                                    const info = getStatusInfo(record.status);
                                    const dateStr = (() => {
                                        try {
                                            return new Date(record.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
                                        } catch { return record.date; }
                                    })();
                                    return (
                                        <View key={`${record.id}-${idx}`} style={[styles.historyItem, { borderLeftColor: info.color }]}>
                                            <View style={styles.historyLeft}>
                                                <Text style={styles.historyCourseName} numberOfLines={1}>{record.courseName}</Text>
                                                <Text style={styles.historyDate}>{dateStr}{record.time ? ` • ${record.time}` : ''}</Text>
                                            </View>
                                            <View style={[styles.historyBadge, { backgroundColor: info.bgColor }]}>
                                                <Text style={[styles.historyBadgeText, { color: info.color }]}>{info.label}</Text>
                                            </View>
                                        </View>
                                    );
                                })}

                                {!showAllHistory && sortedHistory.length > HISTORY_PAGE_SIZE && (
                                    <TouchableOpacity
                                        style={[styles.voirPlusBtn, { borderColor: gradColors[0] + '60', backgroundColor: gradColors[0] + '10' }]}
                                        onPress={() => setShowAllHistory(true)}
                                        activeOpacity={0.75}
                                    >
                                        <ChevronDown size={18} color={gradColors[0]} />
                                        <Text style={[styles.voirPlusText, { color: gradColors[0] }]}>
                                            Voir plus ({sortedHistory.length - HISTORY_PAGE_SIZE} restants)
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        ) : (
                            <View style={styles.emptySection}>
                                <Text style={styles.emptySectionText}>Aucune présence enregistrée.</Text>
                            </View>
                        )}

                        {/* ── COURS PAR PRÉSENCE ── */}
                        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Mes cours par assiduité</Text>
                        <Text style={styles.sectionSubtitle}>Du meilleur au moins bon</Text>

                        {sortedCourses.map((course, idx) => {
                            const pct = course.percentage ?? 0;
                            const courseColor = pct >= 75 ? '#10b981' : pct >= 50 ? '#f59e0b' : pct >= 25 ? '#f97316' : '#ef4444';
                            const Icon = pct >= 75 ? CheckCircle : pct >= 50 ? AlertCircle : XCircle;
                            return (
                                <View key={course.id} style={styles.courseCard}>
                                    {/* Rang */}
                                    <View style={[styles.rankBadge, { backgroundColor: idx < 3 ? courseColor + '20' : '#f8fafc' }]}>
                                        <Text style={[styles.rankText, { color: idx < 3 ? courseColor : '#94a3b8' }]}>
                                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                                        </Text>
                                    </View>
                                    <View style={[styles.courseSideLine, { backgroundColor: courseColor }]} />
                                    <View style={styles.courseInfo}>
                                        <View style={styles.courseTopRow}>
                                            <Text style={styles.courseName} numberOfLines={2}>{course.name}</Text>
                                            {course.status === 'FINISHED' && (
                                                <View style={styles.finishedBadge}><Text style={styles.finishedBadgeText}>TERMINÉ</Text></View>
                                            )}
                                        </View>
                                        <Text style={styles.courseMeta}>{course.attendedCount ?? 0}/{course.totalCount ?? 0} séances</Text>
                                        <View style={styles.progressBarBg}>
                                            <LinearGradient
                                                colors={[courseColor, courseColor + 'AA']}
                                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                                style={[styles.progressBarFill, { width: `${pct}%` }]}
                                            />
                                        </View>
                                    </View>
                                    <View style={[styles.coursePercentBadge, { backgroundColor: courseColor + '20' }]}>
                                        <Icon size={14} color={courseColor} />
                                        <Text style={[styles.coursePercent, { color: courseColor }]}>{pct}%</Text>
                                    </View>
                                </View>
                            );
                        })}

                        {courses.length === 0 && (
                            <View style={styles.emptySection}>
                                <Star size={40} color="#cbd5e1" strokeWidth={1} />
                                <Text style={styles.emptySectionText}>Aucun cours inscrit</Text>
                            </View>
                        )}

                        <View style={{ height: 50 }} />
                    </Animated.View>
                </ScrollView>
            </SafeAreaView>
        </Animated.View>
    );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { ...StyleSheet.absoluteFillObject, backgroundColor: '#f8fafc', zIndex: 200 },
    safeArea: { flex: 1 },
    emojiParticle: { position: 'absolute', top: 0, left: 0, zIndex: 999 },
    confettoShape: { position: 'absolute', top: 0, left: 0, zIndex: 998 },

    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 15,
        paddingTop: Platform.OS === 'ios' ? 15 : 45,
    },
    backBtn: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { color: 'white', fontSize: 18, fontWeight: '800' },

    scrollContent: { padding: 20, paddingTop: 25 },

    mainCard: { borderRadius: 28, overflow: 'hidden', marginBottom: 20, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
    mainCardGradient: { padding: 28, alignItems: 'center' },

    gradeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, gap: 8, marginBottom: 24 },
    gradeEmoji: { fontSize: 22 },
    gradeLabel: { color: 'white', fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },

    bigCircleOuter: { width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)' },
    bigCircleInner: { width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    bigPercentage: { color: 'white', fontSize: 44, fontWeight: '900', lineHeight: 52 },
    bigPercentageLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },

    congratsText: { color: 'rgba(255,255,255,0.95)', fontSize: 15, fontWeight: '600', textAlign: 'center', lineHeight: 22, marginBottom: 24, paddingHorizontal: 10 },

    statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 18, padding: 16, width: '100%', alignItems: 'center' },
    statPill: { flex: 1, alignItems: 'center' },
    statPillValue: { color: 'white', fontSize: 22, fontWeight: '900' },
    statPillLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: '600', marginTop: 2, textAlign: 'center' },
    statPillDivider: { width: 1, height: 35, backgroundColor: 'rgba(255,255,255,0.3)' },

    bannerCard: { borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1 },
    bannerText: { fontSize: 14, fontWeight: '600', lineHeight: 21 },

    sectionTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginBottom: 4 },
    sectionSubtitle: { fontSize: 13, color: '#94a3b8', fontWeight: '500', marginBottom: 15 },

    // Historique de présence
    historyItem: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: 'white', borderRadius: 16, marginBottom: 10,
        padding: 14, borderLeftWidth: 4,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    },
    historyLeft: { flex: 1, marginRight: 12 },
    historyCourseName: { fontSize: 14, fontWeight: '700', color: '#1e293b', marginBottom: 3 },
    historyDate: { fontSize: 12, color: '#94a3b8' },
    historyBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    historyBadgeText: { fontSize: 12, fontWeight: '700' },

    voirPlusBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        borderRadius: 16, paddingVertical: 14, borderWidth: 1.5, gap: 8, marginTop: 4,
    },
    voirPlusText: { fontSize: 14, fontWeight: '700' },

    // Cours
    courseCard: {
        flexDirection: 'row', backgroundColor: 'white', borderRadius: 20, marginBottom: 12,
        overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
        alignItems: 'center', padding: 15, paddingLeft: 8,
    },
    rankBadge: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
    rankText: { fontSize: 14, fontWeight: '900' },
    courseSideLine: { width: 4, alignSelf: 'stretch', borderRadius: 2, marginRight: 12 },
    courseInfo: { flex: 1 },
    courseTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' },
    courseName: { fontSize: 14, fontWeight: '700', color: '#1e293b', flex: 1 },
    finishedBadge: { backgroundColor: '#d1fae5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
    finishedBadgeText: { color: '#065f46', fontSize: 8, fontWeight: '900' },
    courseMeta: { fontSize: 12, color: '#94a3b8', marginBottom: 7 },
    progressBarBg: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 3 },
    coursePercentBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, marginLeft: 8 },
    coursePercent: { fontSize: 14, fontWeight: '800' },

    emptySection: { alignItems: 'center', paddingVertical: 30, gap: 10 },
    emptySectionText: { color: '#94a3b8', fontSize: 14, fontWeight: '500' },
});
