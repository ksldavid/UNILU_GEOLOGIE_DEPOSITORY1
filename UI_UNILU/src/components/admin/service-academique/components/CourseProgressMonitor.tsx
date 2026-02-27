import { useState, useEffect } from 'react';
import {
    BookOpen, Clock, CheckCircle, XCircle, ChevronRight,
    Users, TrendingUp, AlertTriangle, Calendar, X,
    GraduationCap, Filter, Eye
} from 'lucide-react';
import { getCourseProgress } from '../../../../services/stats';
import { courseService } from '../../../../services/course';

// ─── TYPES ─────────────────────────────────────────────────────────────────────
interface SessionDay {
    date: string;           // "2025-10-14"
    label: string;          // "Mardi 14 Oct."
    wasScheduled: boolean;  // Le cours était prévu ce jour
    attendanceTaken: boolean; // La présence a été prise
    hours: number;          // Durée de la séance (ex: 2h ou 3h)
    presentCount?: number;  // Nb étudiants présents
    totalCount?: number;    // Nb total étudiants
    attendanceRate?: number; // % présence
}

interface CourseProgress {
    code: string;
    name: string;
    professor: string;
    professeurTitle: string;
    level: string;
    levelColor: string;
    totalHours: number;   // Volume horaire total confié
    consumedHours: number; // Heures déjà données (présence prise)
    schedule: string;     // "Lundi 08h-10h"
    room: string;
    sessions: SessionDay[];
    totalStudents: number;
}



// ─── HELPERS ───────────────────────────────────────────────────────────────────
function getProgressColor(pct: number) {
    if (pct >= 100) return { bar: 'from-emerald-500 to-teal-400', text: 'text-emerald-700', bg: 'bg-emerald-50' };
    if (pct >= 86) return { bar: 'from-teal-500 to-cyan-400', text: 'text-teal-700', bg: 'bg-teal-50' };
    if (pct >= 51) return { bar: 'from-blue-500 to-indigo-400', text: 'text-blue-700', bg: 'bg-blue-50' };
    if (pct >= 21) return { bar: 'from-amber-400 to-yellow-300', text: 'text-amber-600', bg: 'bg-amber-50' };
    return { bar: 'from-red-500 to-orange-400', text: 'text-red-600', bg: 'bg-red-50' };
}

function getStatusBadge(pct: number) {
    if (pct >= 100) return { label: 'Terminé', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    if (pct >= 86) return { label: 'Finalisation', color: 'bg-teal-100 text-teal-700 border-teal-200' };
    if (pct >= 51) return { label: 'Avancé', color: 'bg-blue-100 text-blue-700 border-blue-200' };
    if (pct >= 21) return { label: 'En cours', color: 'bg-amber-100 text-amber-700 border-amber-200' };
    return { label: 'À surveiller', color: 'bg-red-100 text-red-700 border-red-200' };
}

// ─── COMPOSANT DÉTAIL D'UNE SÉANCE ─────────────────────────────────────────────
function SessionRow({ session }: { session: SessionDay }) {
    const taken = session.attendanceTaken;
    return (
        <div className={`flex items-center gap-4 p-3 rounded-[16px] border transition-all ${taken
            ? 'bg-[#F1F8F4] border-[#95D5B2]/50 hover:border-[#74C69D]'
            : 'bg-red-50/60 border-red-200/50 hover:border-red-300'
            }`}>

            {/* Icône statut */}
            <div className={`w-9 h-9 rounded-[12px] flex items-center justify-center flex-shrink-0 ${taken ? 'bg-[#D8F3DC]' : 'bg-red-100'}`}>
                {taken
                    ? <CheckCircle className="w-5 h-5 text-[#1B4332]" />
                    : <XCircle className="w-5 h-5 text-red-500" />
                }
            </div>

            {/* Date et statut */}
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold ${taken ? 'text-[#1B4332]' : 'text-red-600'}`}>
                    {session.label}
                </p>
                <p className={`text-xs mt-0.5 ${taken ? 'text-[#52796F]' : 'text-red-400'}`}>
                    {taken ? `Présence prise · ${session.hours}h de cours` : 'Cours prévu — Présence non prise'}
                </p>
            </div>

            {/* Heures */}
            <div className="flex-shrink-0 text-center">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${taken
                    ? 'bg-white border-[#95D5B2] text-[#2D6A4F]'
                    : 'bg-red-50 border-red-200 text-red-500'
                    }`}>
                    {taken ? `+${session.hours}h` : `±${session.hours}h`}
                </span>
            </div>

            {/* Taux présence (si prise) */}
            {taken && session.attendanceRate !== undefined && (
                <div className="flex-shrink-0 text-right w-20">
                    <p className="text-xs text-[#52796F]">{session.presentCount}/{session.totalCount}</p>
                    <div className="w-full bg-[#D8F3DC] rounded-full h-1.5 mt-1 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-[#52B788] to-[#74C69D] rounded-full transition-all"
                            style={{ width: `${session.attendanceRate}%` }}
                        />
                    </div>
                    <p className={`text-[10px] font-bold mt-0.5 ${session.attendanceRate >= 90 ? 'text-[#1B4332]' : session.attendanceRate >= 70 ? 'text-amber-600' : 'text-red-500'}`}>
                        {session.attendanceRate}%
                    </p>
                </div>
            )}
        </div>
    );
}

// ─── COMPOSANT CARTE COURS ─────────────────────────────────────────────────────
function CourseCard({ course, onClick }: { course: CourseProgress; onClick: () => void }) {
    const pct = Math.round((course.consumedHours / course.totalHours) * 100);
    const remaining = course.totalHours - course.consumedHours;
    const prog = getProgressColor(pct);
    const badge = getStatusBadge(pct);
    const missedSessions = course.sessions.filter(s => s.wasScheduled && !s.attendanceTaken).length;

    return (
        <div
            onClick={onClick}
            className="group bg-white rounded-[28px] border border-[#1B4332]/10 p-6 hover:shadow-xl hover:border-[#74C69D]/60 transition-all cursor-pointer relative overflow-hidden"
        >
            {/* Décoration fond */}
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-5 -mr-10 -mt-10"
                style={{ background: course.levelColor }} />

            {/* Header */}
            <div className="flex items-start justify-between mb-4 relative">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-11 h-11 rounded-[14px] flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: course.levelColor + '22' }}>
                        <BookOpen className="w-5 h-5" style={{ color: course.levelColor }} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-mono font-bold text-[#52796F] uppercase tracking-wider mb-0.5">
                            {course.code}
                        </p>
                        <h3 className="text-sm font-bold text-[#1B4332] leading-tight line-clamp-2 group-hover:text-[#2D6A4F] transition-colors">
                            {course.name}
                        </h3>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0 ml-2">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${badge.color}`}>
                        {badge.label}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: course.levelColor }}>
                        {course.level}
                    </span>
                </div>
            </div>

            {/* Prof */}
            <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full bg-[#1B4332]/10 flex items-center justify-center text-[10px] font-black text-[#1B4332]">
                    {course.professor.charAt(6)}
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-bold text-[#1B4332] truncate">{course.professor}</p>
                    <p className="text-[10px] text-[#52796F] truncate">{course.professeurTitle}</p>
                </div>
            </div>

            {/* Infos planning */}
            <div className="flex items-center gap-3 mb-4 text-[11px] text-[#52796F]">
                <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{course.schedule}</span>
                </div>
                <span className="text-[#1B4332]/20">•</span>
                <span>{course.room}</span>
            </div>

            {/* Barre de progression */}
            <div className="mb-3">
                <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-[#52796F] font-bold uppercase tracking-wide">Avancement</span>
                    <span className={`text-sm font-black ${prog.text}`}>{pct}%</span>
                </div>
                <div className="w-full bg-[#F1F8F4] rounded-full h-2.5 overflow-hidden border border-[#1B4332]/5">
                    <div
                        className={`h-full bg-gradient-to-r ${prog.bar} rounded-full transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                    />
                </div>
            </div>

            {/* Heures */}
            <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-[#F1F8F4] rounded-[14px] p-2.5 text-center">
                    <p className="text-xs font-black text-[#1B4332]">{course.totalHours}h</p>
                    <p className="text-[9px] text-[#52796F] uppercase tracking-wide">Total</p>
                </div>
                <div className="bg-[#D8F3DC] rounded-[14px] p-2.5 text-center">
                    <p className="text-xs font-black text-[#1B4332]">{course.consumedHours}h</p>
                    <p className="text-[9px] text-[#1B4332]/60 uppercase tracking-wide">Données</p>
                </div>
                <div className={`${remaining <= 6 ? 'bg-orange-50' : 'bg-[#F1F8F4]'} rounded-[14px] p-2.5 text-center`}>
                    <p className={`text-xs font-black ${remaining <= 6 ? 'text-orange-600' : 'text-[#1B4332]'}`}>{remaining}h</p>
                    <p className={`text-[9px] uppercase tracking-wide ${remaining <= 6 ? 'text-orange-400' : 'text-[#52796F]'}`}>Restant</p>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-[#1B4332]/5 pt-3">
                <div className="flex items-center gap-3 text-[10px]">
                    <div className="flex items-center gap-1 text-[#1B4332]">
                        <Users className="w-3 h-3" />
                        <span className="font-bold">{course.totalStudents}</span> étudiants
                    </div>
                    {missedSessions > 0 && (
                        <div className="flex items-center gap-1 text-red-500">
                            <AlertTriangle className="w-3 h-3" />
                            <span className="font-bold">{missedSessions}</span> séance{missedSessions > 1 ? 's' : ''} manquée{missedSessions > 1 ? 's' : ''}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-1 text-[#52796F] group-hover:text-[#1B4332] transition-colors">
                    <Eye className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold">Détails</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                </div>
            </div>
        </div>
    );
}

// ─── COMPOSANT DÉTAIL MODAL ─────────────────────────────────────────────────────
function CourseDetailModal({ course, onClose }: { course: CourseProgress; onClose: () => void }) {
    const pct = Math.round((course.consumedHours / course.totalHours) * 100);
    const remaining = course.totalHours - course.consumedHours;
    const prog = getProgressColor(pct);
    const takenSessions = course.sessions.filter(s => s.attendanceTaken);
    const missedSessions = course.sessions.filter(s => s.wasScheduled && !s.attendanceTaken);
    const avgAttendance = takenSessions.length > 0
        ? Math.round(takenSessions.reduce((a, s) => a + (s.attendanceRate || 0), 0) / takenSessions.length)
        : 0;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-[#1B4332] p-6 text-white flex-shrink-0">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="w-12 h-12 bg-white/20 rounded-[16px] flex items-center justify-center">
                                <BookOpen className="w-6 h-6 text-white" />
                            </div>
                            <div className="min-w-0">
                                <span className="text-[10px] font-mono font-bold bg-white/15 px-2 py-0.5 rounded-full tracking-widest">
                                    {course.code}
                                </span>
                                <h2 className="text-lg font-black mt-1 leading-tight">{course.name}</h2>
                                <p className="text-white/70 text-xs mt-0.5">{course.professor} · {course.level}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/15 rounded-full transition-colors flex-shrink-0 ml-2"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Barre de progression dans le header */}
                    <div className="mt-5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-white/70 font-bold uppercase tracking-wide">Progression du semestre</span>
                            <span className="text-2xl font-black">{pct}%</span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                            <div
                                className={`h-full bg-gradient-to-r ${prog.bar} rounded-full transition-all`}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-white/60">
                            <span>{course.consumedHours}h données</span>
                            <span>{remaining}h restantes / {course.totalHours}h total</span>
                        </div>
                    </div>
                </div>

                {/* Stats résumées */}
                <div className="bg-[#F1F8F4] px-6 py-4 grid grid-cols-4 gap-3 flex-shrink-0 border-b border-[#1B4332]/10">
                    <div className="text-center">
                        <p className="text-xl font-black text-[#1B4332]">{takenSessions.length}</p>
                        <p className="text-[10px] text-[#52796F] uppercase tracking-wide">Séances faites</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xl font-black text-red-500">{missedSessions.length}</p>
                        <p className="text-[10px] text-[#52796F] uppercase tracking-wide">Séances ratées</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xl font-black text-[#1B4332]">{avgAttendance}%</p>
                        <p className="text-[10px] text-[#52796F] uppercase tracking-wide">Moy. présence</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xl font-black text-[#1B4332]">{course.totalStudents}</p>
                        <p className="text-[10px] text-[#52796F] uppercase tracking-wide">Étudiants</p>
                    </div>
                </div>

                {/* Infos du cours */}
                <div className="px-6 py-3 flex items-center gap-4 text-xs text-[#52796F] bg-white border-b border-[#1B4332]/5 flex-shrink-0">
                    <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#1B4332]" />
                        <span className="font-bold text-[#1B4332]">{course.schedule}</span>
                    </div>
                    <span className="text-[#1B4332]/20">•</span>
                    <span>{course.room}</span>
                    <span className="text-[#1B4332]/20">•</span>
                    <span>{course.professeurTitle}</span>
                </div>

                {/* Liste des séances */}
                <div className="flex-1 overflow-y-auto p-6 space-y-2">
                    {/* Légende */}
                    <div className="flex items-center gap-4 mb-4 text-[11px] text-[#52796F]">
                        <div className="flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5 text-[#2D6A4F]" />
                            <span>Présence prise (séance comptabilisée)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5 text-red-500" />
                            <span>Présence non prise (non comptabilisée)</span>
                        </div>
                    </div>

                    {/* Séances */}
                    <div className="space-y-2">
                        {course.sessions.map((session, i) => (
                            <SessionRow key={i} session={session} />
                        ))}
                    </div>

                    {/* Alerte séances manquées */}
                    {missedSessions.length > 0 && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-[20px] flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-red-700">
                                    {missedSessions.length} séance{missedSessions.length > 1 ? 's' : ''} sans présence enregistrée
                                </p>
                                <p className="text-xs text-red-500 mt-1">
                                    Ces jours ne sont pas comptabilisés dans la progression horaire.
                                    Un suivi auprès du professeur est recommandé.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── COMPOSANT PRINCIPAL ────────────────────────────────────────────────────────
export function CourseProgressMonitor() {
    const [courses, setCourses] = useState<CourseProgress[]>([]);
    const [academicLevels, setAcademicLevels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLevel, setSelectedLevel] = useState('Tous');
    const [selectedCourse, setSelectedCourse] = useState<CourseProgress | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState<'progress' | 'name' | 'level'>('progress');

    // Chargement initial
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [levelsData, progressData] = await Promise.all([
                    courseService.getLevels(),
                    getCourseProgress()
                ]);
                setAcademicLevels(levelsData);
                setCourses(progressData);
            } catch (error) {
                console.error('Failed to load courses:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const filtered = courses
        .filter(c => {
            const matchesLevel = selectedLevel === 'Tous' || c.level === selectedLevel;
            const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.professor.toLowerCase().includes(searchTerm.toLowerCase());

            let matchesStatus = true;
            if (statusFilter !== 'all') {
                const pct = (c.consumedHours / c.totalHours) * 100;
                if (statusFilter === 'À surveiller') matchesStatus = pct < 21;
                else if (statusFilter === 'En cours') matchesStatus = pct >= 21 && pct <= 50;
                else if (statusFilter === 'Avancé') matchesStatus = pct >= 51 && pct <= 85;
                else if (statusFilter === 'Finalisation') matchesStatus = pct >= 86 && pct <= 99;
                else if (statusFilter === 'Terminé') matchesStatus = pct >= 100;
            }

            return matchesLevel && matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            if (sortBy === 'progress') {
                const pctA = a.consumedHours / a.totalHours;
                const pctB = b.consumedHours / b.totalHours;
                return pctB - pctA;
            }
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            return a.level.localeCompare(b.level);
        });

    // Stats globales
    const totalHoursAll = courses.reduce((a, c) => a + c.totalHours, 0);
    const consumedHoursAll = courses.reduce((a, c) => a + c.consumedHours, 0);
    const globalPct = totalHoursAll > 0 ? Math.round((consumedHoursAll / totalHoursAll) * 100) : 0;
    const totalMissed = courses.reduce((a, c) => a + c.sessions.filter(s => s.wasScheduled && !s.attendanceTaken).length, 0);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <div className="w-12 h-12 border-4 border-[#1B4332] border-t-transparent rounded-full animate-spin" />
                <p className="text-[#52796F] font-medium italic animate-pulse">Synchronisation des cours réels...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-black text-[#1B4332]">Suivi de la Charge Horaire</h2>
                    <p className="text-sm text-[#52796F] mt-0.5">
                        Progression des cours programmés — Semestre 2025–2026
                    </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#52796F] bg-[#1B4332]/5 px-4 py-2 rounded-[14px] border border-[#1B4332]/10">
                    <TrendingUp className="w-4 h-4 text-[#1B4332]" />
                    <span>Données synchronisées avec la Base de Données</span>
                </div>
            </div>

            {/* Cartes Statistiques Globales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/80 backdrop-blur-sm rounded-[24px] p-5 border border-[#1B4332]/10">
                    <div className="w-10 h-10 bg-[#D8F3DC] rounded-[12px] flex items-center justify-center mb-3">
                        <TrendingUp className="w-5 h-5 text-[#1B4332]" />
                    </div>
                    <p className="text-3xl font-black text-[#1B4332]">{globalPct}%</p>
                    <p className="text-xs text-[#52796F] mt-1">Progression globale</p>
                    <div className="w-full bg-[#F1F8F4] rounded-full h-1.5 mt-2 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#52B788] to-[#74C69D] rounded-full" style={{ width: `${globalPct}%` }} />
                    </div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-[24px] p-5 border border-[#1B4332]/10">
                    <div className="w-10 h-10 bg-[#D8F3DC] rounded-[12px] flex items-center justify-center mb-3">
                        <Clock className="w-5 h-5 text-[#1B4332]" />
                    </div>
                    <p className="text-3xl font-black text-[#1B4332]">{consumedHoursAll}h</p>
                    <p className="text-xs text-[#52796F] mt-1">Heures données / {totalHoursAll}h total</p>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-[24px] p-5 border border-[#1B4332]/10">
                    <div className="w-10 h-10 bg-orange-50 rounded-[12px] flex items-center justify-center mb-3">
                        <XCircle className="w-5 h-5 text-orange-500" />
                    </div>
                    <p className="text-3xl font-black text-orange-500">{totalMissed}</p>
                    <p className="text-xs text-[#52796F] mt-1">Séances sans présence</p>
                </div>
            </div>

            {/* Filtres Principaux */}
            <div className="bg-white/80 backdrop-blur-sm rounded-[24px] border border-[#1B4332]/10 p-4 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                    {/* Recherche */}
                    <div className="flex-1 min-w-[220px] flex items-center gap-2 bg-[#F1F8F4] rounded-[14px] px-3 py-2.5 border border-[#1B4332]/5">
                        <BookOpen className="w-4 h-4 text-[#52796F]" />
                        <input
                            type="text"
                            placeholder="Rechercher cours, code, prof..."
                            className="bg-transparent text-sm outline-none w-full text-[#1B4332] placeholder:text-[#52796F]/60"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Filtre niveau */}
                    <div className="flex-1 overflow-x-auto scrollbar-hide">
                        <div className="flex items-center gap-1 bg-[#F1F8F4] rounded-[14px] p-1 border border-[#1B4332]/5 w-max min-w-full">
                            <button
                                onClick={() => setSelectedLevel('Tous')}
                                className={`px-3 py-1.5 rounded-[10px] text-xs font-bold transition-all whitespace-nowrap ${selectedLevel === 'Tous'
                                    ? 'bg-[#1B4332] text-white'
                                    : 'text-[#52796F]'
                                    }`}
                            >
                                Tous
                            </button>
                            {academicLevels.map(level => (
                                <button
                                    key={level.id}
                                    onClick={() => setSelectedLevel(level.code.toUpperCase())}
                                    className={`px-3 py-1.5 rounded-[10px] text-xs font-bold transition-all whitespace-nowrap ${selectedLevel === level.code.toUpperCase()
                                        ? 'bg-[#1B4332] text-white shadow-sm'
                                        : 'text-[#52796F] hover:text-[#1B4332]'
                                        }`}
                                >
                                    {level.code.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tri */}
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-[#52796F]" />
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value as any)}
                            className="bg-[#F1F8F4] border border-[#1B4332]/5 rounded-[12px] px-3 py-2 text-xs text-[#1B4332] outline-none font-bold"
                        >
                            <option value="progress">Trier : Avancement ↓</option>
                            <option value="name">Trier : Nom A–Z</option>
                            <option value="level">Trier : Niveau</option>
                        </select>
                    </div>
                </div>

                {/* Filtres par Statut (Nouveau) */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-[#1B4332]/5">
                    {[
                        { id: 'all', label: 'Tous', count: courses.length, color: 'text-gray-600', bg: 'bg-gray-100', active: 'bg-gray-900 text-white' },
                        { id: 'À surveiller', label: 'À surveiller', count: courses.filter(c => (c.consumedHours / c.totalHours * 100) < 21).length, color: 'text-red-600', bg: 'bg-red-50', active: 'bg-red-600 text-white' },
                        { id: 'En cours', label: 'En cours', count: courses.filter(c => { const p = c.consumedHours / c.totalHours * 100; return p >= 21 && p <= 50; }).length, color: 'text-amber-600', bg: 'bg-amber-50', active: 'bg-amber-600 text-white' },
                        { id: 'Avancé', label: 'Avancé', count: courses.filter(c => { const p = c.consumedHours / c.totalHours * 100; return p >= 51 && p <= 85; }).length, color: 'text-blue-600', bg: 'bg-blue-50', active: 'bg-blue-600 text-white' },
                        { id: 'Finalisation', label: 'Finalisation', count: courses.filter(c => { const p = c.consumedHours / c.totalHours * 100; return p >= 86 && p <= 99; }).length, color: 'text-teal-600', bg: 'bg-teal-50', active: 'bg-teal-600 text-white' },
                        { id: 'Terminé', label: 'Terminé', count: courses.filter(c => (c.consumedHours / c.totalHours * 100) >= 100).length, color: 'text-emerald-600', bg: 'bg-emerald-50', active: 'bg-emerald-600 text-white' },
                    ].map(status => (
                        <button
                            key={status.id}
                            onClick={() => setStatusFilter(status.id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border border-transparent hover:scale-[1.02] active:scale-[0.98] ${statusFilter === status.id
                                ? status.active
                                : `${status.bg} ${status.color} hover:border-current/20`
                                }`}
                        >
                            <span>{status.label}</span>
                            <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${statusFilter === status.id ? 'bg-white/20' : 'bg-white'}`}>
                                {status.count}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Résumé par niveau dynamique */}
            <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide">
                {academicLevels.map(lvl => {
                    const lvlCode = lvl.code.toUpperCase();
                    const lvlCourses = courses.filter(c => c.level === lvlCode);
                    if (lvlCourses.length === 0) return null;
                    const lvlPct = Math.round(lvlCourses.reduce((a, c) => a + c.consumedHours / c.totalHours, 0) / (lvlCourses.length || 1) * 100);
                    return (
                        <button
                            key={lvlCode}
                            onClick={() => setSelectedLevel(selectedLevel === lvlCode ? 'Tous' : lvlCode)}
                            className={`min-w-[160px] flex-shrink-0 bg-white/80 rounded-[20px] p-4 border text-left transition-all hover:shadow-md ${selectedLevel === lvlCode ? 'border-[#1B4332]/40 shadow-md' : 'border-[#1B4332]/10'}`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black text-[#1B4332] uppercase tracking-wider">{lvlCode}</span>
                                <span className="text-sm font-black text-[#1B4332]">{lvlPct}%</span>
                            </div>
                            <div className="w-full bg-[#F1F8F4] rounded-full h-1.5 overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-[#52B788] to-[#74C69D] rounded-full"
                                    style={{ width: `${lvlPct}%` }} />
                            </div>
                            <p className="text-[9px] text-[#52796F] font-bold mt-1.5 uppercase tracking-tighter">{lvlCourses.length} cours actifs</p>
                        </button>
                    );
                })}
            </div>

            {/* Header liste */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#52796F]">
                    {filtered.length} cours programmé{filtered.length > 1 ? 's' : ''}
                    {selectedLevel !== 'Tous' && <span className="ml-2 text-[#1B4332]">— {selectedLevel}</span>}
                </h3>
                <div className="flex items-center gap-2 text-[10px] text-[#52796F]">
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Cliquez sur un cours pour voir le détail des séances</span>
                </div>
            </div>

            {/* Grille des cours */}
            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white/60 rounded-[28px] border border-dashed border-[#1B4332]/20">
                    <BookOpen className="w-10 h-10 text-[#1B4332]/20 mb-3" />
                    <p className="text-[#52796F] font-medium">Aucun cours trouvé</p>
                    <p className="text-xs text-[#52796F]/60 mt-1">Essayez un autre filtre ou terme de recherche</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filtered.map(course => (
                        <CourseCard
                            key={course.code}
                            course={course}
                            onClick={() => setSelectedCourse(course)}
                        />
                    ))}
                </div>
            )}

            {/* Modal Détail */}
            {selectedCourse && (
                <CourseDetailModal
                    course={selectedCourse}
                    onClose={() => setSelectedCourse(null)}
                />
            )}
        </div>
    );
}
