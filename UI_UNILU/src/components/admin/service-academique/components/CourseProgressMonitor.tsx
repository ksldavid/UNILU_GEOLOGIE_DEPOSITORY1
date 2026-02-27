import { useState } from 'react';
import {
    BookOpen, Clock, CheckCircle, XCircle, ChevronRight,
    Users, TrendingUp, AlertTriangle, Calendar, X,
    GraduationCap, Filter, BarChart2, Eye
} from 'lucide-react';

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

// ─── DONNÉES FICTIVES ───────────────────────────────────────────────────────────
const MOCK_COURSES: CourseProgress[] = [
    {
        code: 'GEOL101A',
        name: 'Introduction à la Pétrologie',
        professor: 'Prof. Jean-Baptiste Mukendi',
        professeurTitle: 'Docteur en Sciences Géologiques',
        level: 'B1',
        levelColor: '#2D6A4F',
        totalHours: 30,
        consumedHours: 18,
        schedule: 'Lundi 08h00 – 10h00',
        room: 'Salle A-04',
        totalStudents: 42,
        sessions: [
            { date: '2025-10-06', label: 'Lundi 06 Oct.', wasScheduled: true, attendanceTaken: true, hours: 2, presentCount: 40, totalCount: 42, attendanceRate: 95 },
            { date: '2025-10-13', label: 'Lundi 13 Oct.', wasScheduled: true, attendanceTaken: true, hours: 2, presentCount: 37, totalCount: 42, attendanceRate: 88 },
            { date: '2025-10-20', label: 'Lundi 20 Oct.', wasScheduled: true, attendanceTaken: false, hours: 2, presentCount: 0, totalCount: 42, attendanceRate: 0 },
            { date: '2025-10-27', label: 'Lundi 27 Oct.', wasScheduled: true, attendanceTaken: true, hours: 2, presentCount: 39, totalCount: 42, attendanceRate: 93 },
            { date: '2025-11-03', label: 'Lundi 03 Nov.', wasScheduled: true, attendanceTaken: true, hours: 3, presentCount: 41, totalCount: 42, attendanceRate: 98 },
            { date: '2025-11-10', label: 'Lundi 10 Nov.', wasScheduled: true, attendanceTaken: true, hours: 2, presentCount: 35, totalCount: 42, attendanceRate: 83 },
            { date: '2025-11-17', label: 'Lundi 17 Nov.', wasScheduled: true, attendanceTaken: false, hours: 2, presentCount: 0, totalCount: 42, attendanceRate: 0 },
            { date: '2025-11-24', label: 'Lundi 24 Nov.', wasScheduled: true, attendanceTaken: true, hours: 3, presentCount: 40, totalCount: 42, attendanceRate: 95 },
            { date: '2025-12-01', label: 'Lundi 01 Déc.', wasScheduled: true, attendanceTaken: false, hours: 2, presentCount: 0, totalCount: 42, attendanceRate: 0 },
        ],
    },
    {
        code: 'GEOL102A',
        name: 'Minéralogie descriptive',
        professor: 'Prof. Marie-Claire Kabila',
        professeurTitle: 'Maître de Conférences',
        level: 'B1',
        levelColor: '#2D6A4F',
        totalHours: 45,
        consumedHours: 36,
        schedule: 'Mercredi 10h00 – 13h00',
        room: 'Amphi B',
        totalStudents: 42,
        sessions: [
            { date: '2025-10-08', label: 'Mer. 08 Oct.', wasScheduled: true, attendanceTaken: true, hours: 3, presentCount: 42, totalCount: 42, attendanceRate: 100 },
            { date: '2025-10-15', label: 'Mer. 15 Oct.', wasScheduled: true, attendanceTaken: true, hours: 3, presentCount: 40, totalCount: 42, attendanceRate: 95 },
            { date: '2025-10-22', label: 'Mer. 22 Oct.', wasScheduled: true, attendanceTaken: true, hours: 3, presentCount: 39, totalCount: 42, attendanceRate: 93 },
            { date: '2025-10-29', label: 'Mer. 29 Oct.', wasScheduled: true, attendanceTaken: true, hours: 3, presentCount: 41, totalCount: 42, attendanceRate: 98 },
            { date: '2025-11-05', label: 'Mer. 05 Nov.', wasScheduled: true, attendanceTaken: true, hours: 3, presentCount: 38, totalCount: 42, attendanceRate: 90 },
            { date: '2025-11-12', label: 'Mer. 12 Nov.', wasScheduled: true, attendanceTaken: true, hours: 3, presentCount: 40, totalCount: 42, attendanceRate: 95 },
            { date: '2025-11-19', label: 'Mer. 19 Nov.', wasScheduled: true, attendanceTaken: true, hours: 3, presentCount: 42, totalCount: 42, attendanceRate: 100 },
            { date: '2025-11-26', label: 'Mer. 26 Nov.', wasScheduled: true, attendanceTaken: true, hours: 3, presentCount: 37, totalCount: 42, attendanceRate: 88 },
            { date: '2025-12-03', label: 'Mer. 03 Déc.', wasScheduled: true, attendanceTaken: false, hours: 3, presentCount: 0, totalCount: 42, attendanceRate: 0 },
        ],
    },
    {
        code: 'GEOL103B',
        name: 'Paléontologie',
        professor: 'Prof. Augustin Ilunga',
        professeurTitle: 'Professeur Ordinaire',
        level: 'B1',
        levelColor: '#2D6A4F',
        totalHours: 30,
        consumedHours: 6,
        schedule: 'Vendredi 14h00 – 16h00',
        room: 'Salle C-12',
        totalStudents: 42,
        sessions: [
            { date: '2025-10-10', label: 'Ven. 10 Oct.', wasScheduled: true, attendanceTaken: true, hours: 2, presentCount: 38, totalCount: 42, attendanceRate: 90 },
            { date: '2025-10-17', label: 'Ven. 17 Oct.', wasScheduled: true, attendanceTaken: false, hours: 2, presentCount: 0, totalCount: 42, attendanceRate: 0 },
            { date: '2025-10-24', label: 'Ven. 24 Oct.', wasScheduled: true, attendanceTaken: true, hours: 2, presentCount: 35, totalCount: 42, attendanceRate: 83 },
            { date: '2025-10-31', label: 'Ven. 31 Oct.', wasScheduled: true, attendanceTaken: false, hours: 2, presentCount: 0, totalCount: 42, attendanceRate: 0 },
            { date: '2025-11-07', label: 'Ven. 07 Nov.', wasScheduled: true, attendanceTaken: false, hours: 2, presentCount: 0, totalCount: 42, attendanceRate: 0 },
            { date: '2025-11-14', label: 'Ven. 14 Nov.', wasScheduled: true, attendanceTaken: true, hours: 2, presentCount: 36, totalCount: 42, attendanceRate: 86 },
        ],
    },
    {
        code: 'GEOL201A',
        name: 'Géologie Structurale',
        professor: 'Prof. Emmanuel Kasongo',
        professeurTitle: 'Chef de Département',
        level: 'B2',
        levelColor: '#52B788',
        totalHours: 45,
        consumedHours: 27,
        schedule: 'Mardi 08h00 – 11h00',
        room: 'Amphi Principal',
        totalStudents: 38,
        sessions: [
            { date: '2025-10-07', label: 'Mar. 07 Oct.', wasScheduled: true, attendanceTaken: true, hours: 3, presentCount: 36, totalCount: 38, attendanceRate: 95 },
            { date: '2025-10-14', label: 'Mar. 14 Oct.', wasScheduled: true, attendanceTaken: true, hours: 3, presentCount: 35, totalCount: 38, attendanceRate: 92 },
            { date: '2025-10-21', label: 'Mar. 21 Oct.', wasScheduled: true, attendanceTaken: true, hours: 3, presentCount: 38, totalCount: 38, attendanceRate: 100 },
            { date: '2025-10-28', label: 'Mar. 28 Oct.', wasScheduled: true, attendanceTaken: false, hours: 3, presentCount: 0, totalCount: 38, attendanceRate: 0 },
            { date: '2025-11-04', label: 'Mar. 04 Nov.', wasScheduled: true, attendanceTaken: true, hours: 3, presentCount: 34, totalCount: 38, attendanceRate: 89 },
            { date: '2025-11-11', label: 'Mar. 11 Nov.', wasScheduled: true, attendanceTaken: true, hours: 3, presentCount: 37, totalCount: 38, attendanceRate: 97 },
            { date: '2025-11-18', label: 'Mar. 18 Nov.', wasScheduled: true, attendanceTaken: true, hours: 3, presentCount: 33, totalCount: 38, attendanceRate: 87 },
            { date: '2025-11-25', label: 'Mar. 25 Nov.', wasScheduled: true, attendanceTaken: false, hours: 3, presentCount: 0, totalCount: 38, attendanceRate: 0 },
        ],
    },
    {
        code: 'GEOL301A',
        name: 'Géochimie',
        professor: 'Prof. Véronique Mwamba',
        professeurTitle: 'Docteur en Géochimie Minière',
        level: 'B3',
        levelColor: '#95D5B2',
        totalHours: 30,
        consumedHours: 24,
        schedule: 'Jeudi 10h00 – 12h00',
        room: 'Labo Géochimie',
        totalStudents: 29,
        sessions: [
            { date: '2025-10-09', label: 'Jeu. 09 Oct.', wasScheduled: true, attendanceTaken: true, hours: 2, presentCount: 28, totalCount: 29, attendanceRate: 97 },
            { date: '2025-10-16', label: 'Jeu. 16 Oct.', wasScheduled: true, attendanceTaken: true, hours: 2, presentCount: 27, totalCount: 29, attendanceRate: 93 },
            { date: '2025-10-23', label: 'Jeu. 23 Oct.', wasScheduled: true, attendanceTaken: true, hours: 2, presentCount: 29, totalCount: 29, attendanceRate: 100 },
            { date: '2025-10-30', label: 'Jeu. 30 Oct.', wasScheduled: true, attendanceTaken: true, hours: 2, presentCount: 26, totalCount: 29, attendanceRate: 90 },
            { date: '2025-11-06', label: 'Jeu. 06 Nov.', wasScheduled: true, attendanceTaken: true, hours: 2, presentCount: 28, totalCount: 29, attendanceRate: 97 },
            { date: '2025-11-13', label: 'Jeu. 13 Nov.', wasScheduled: true, attendanceTaken: true, hours: 2, presentCount: 25, totalCount: 29, attendanceRate: 86 },
            { date: '2025-11-20', label: 'Jeu. 20 Nov.', wasScheduled: true, attendanceTaken: true, hours: 2, presentCount: 29, totalCount: 29, attendanceRate: 100 },
            { date: '2025-11-27', label: 'Jeu. 27 Nov.', wasScheduled: true, attendanceTaken: true, hours: 2, presentCount: 27, totalCount: 29, attendanceRate: 93 },
            { date: '2025-12-04', label: 'Jeu. 04 Déc.', wasScheduled: true, attendanceTaken: false, hours: 2, presentCount: 0, totalCount: 29, attendanceRate: 0 },
        ],
    },
    {
        code: 'M1HYDRO01',
        name: 'Hydrogéologie Appliquée',
        professor: 'Prof. Pierre Nkulu',
        professeurTitle: 'Professeur Associé - PhD',
        level: 'M1 Hydro.',
        levelColor: '#1B4332',
        totalHours: 60,
        consumedHours: 40,
        schedule: 'Samedi 08h00 – 12h00',
        room: 'Salle Masters',
        totalStudents: 18,
        sessions: [
            { date: '2025-10-04', label: 'Sam. 04 Oct.', wasScheduled: true, attendanceTaken: true, hours: 4, presentCount: 18, totalCount: 18, attendanceRate: 100 },
            { date: '2025-10-11', label: 'Sam. 11 Oct.', wasScheduled: true, attendanceTaken: true, hours: 4, presentCount: 17, totalCount: 18, attendanceRate: 94 },
            { date: '2025-10-18', label: 'Sam. 18 Oct.', wasScheduled: true, attendanceTaken: true, hours: 4, presentCount: 16, totalCount: 18, attendanceRate: 89 },
            { date: '2025-10-25', label: 'Sam. 25 Oct.', wasScheduled: true, attendanceTaken: false, hours: 4, presentCount: 0, totalCount: 18, attendanceRate: 0 },
            { date: '2025-11-01', label: 'Sam. 01 Nov.', wasScheduled: true, attendanceTaken: true, hours: 4, presentCount: 18, totalCount: 18, attendanceRate: 100 },
            { date: '2025-11-08', label: 'Sam. 08 Nov.', wasScheduled: true, attendanceTaken: true, hours: 4, presentCount: 15, totalCount: 18, attendanceRate: 83 },
            { date: '2025-11-15', label: 'Sam. 15 Nov.', wasScheduled: true, attendanceTaken: true, hours: 4, presentCount: 18, totalCount: 18, attendanceRate: 100 },
            { date: '2025-11-22', label: 'Sam. 22 Nov.', wasScheduled: true, attendanceTaken: true, hours: 4, presentCount: 17, totalCount: 18, attendanceRate: 94 },
            { date: '2025-11-29', label: 'Sam. 29 Nov.', wasScheduled: true, attendanceTaken: false, hours: 4, presentCount: 0, totalCount: 18, attendanceRate: 0 },
            { date: '2025-12-06', label: 'Sam. 06 Déc.', wasScheduled: true, attendanceTaken: false, hours: 4, presentCount: 0, totalCount: 18, attendanceRate: 0 },
        ],
    },
];

const LEVELS = ['Tous', 'B1', 'B2', 'B3', 'M1 Hydro.'];

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
    const [selectedLevel, setSelectedLevel] = useState('Tous');
    const [selectedCourse, setSelectedCourse] = useState<CourseProgress | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState<'progress' | 'name' | 'level'>('progress');

    const filtered = MOCK_COURSES
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
    const totalHoursAll = MOCK_COURSES.reduce((a, c) => a + c.totalHours, 0);
    const consumedHoursAll = MOCK_COURSES.reduce((a, c) => a + c.consumedHours, 0);
    const globalPct = Math.round((consumedHoursAll / totalHoursAll) * 100);

    const totalMissed = MOCK_COURSES.reduce((a, c) => a + c.sessions.filter(s => s.wasScheduled && !s.attendanceTaken).length, 0);

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
                <div className="flex items-center gap-2 text-xs text-[#52796F] bg-white/80 px-4 py-2 rounded-[14px] border border-[#1B4332]/10">
                    <BarChart2 className="w-4 h-4 text-[#1B4332]" />
                    <span>Données fictives — Connexion BD à venir</span>
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
                    <div className="flex items-center gap-1 bg-[#F1F8F4] rounded-[14px] p-1 border border-[#1B4332]/5">
                        {LEVELS.map(level => (
                            <button
                                key={level}
                                onClick={() => setSelectedLevel(level)}
                                className={`px-3 py-1.5 rounded-[10px] text-xs font-bold transition-all ${selectedLevel === level
                                    ? 'bg-[#1B4332] text-white shadow-sm'
                                    : 'text-[#52796F] hover:text-[#1B4332]'
                                    }`}
                            >
                                {level}
                            </button>
                        ))}
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
                        { id: 'all', label: 'Tous', count: MOCK_COURSES.length, color: 'text-gray-600', bg: 'bg-gray-100', active: 'bg-gray-900 text-white' },
                        { id: 'À surveiller', label: 'À surveiller', count: MOCK_COURSES.filter(c => (c.consumedHours / c.totalHours * 100) < 21).length, color: 'text-red-600', bg: 'bg-red-50', active: 'bg-red-600 text-white' },
                        { id: 'En cours', label: 'En cours', count: MOCK_COURSES.filter(c => { const p = c.consumedHours / c.totalHours * 100; return p >= 21 && p <= 50; }).length, color: 'text-amber-600', bg: 'bg-amber-50', active: 'bg-amber-600 text-white' },
                        { id: 'Avancé', label: 'Avancé', count: MOCK_COURSES.filter(c => { const p = c.consumedHours / c.totalHours * 100; return p >= 51 && p <= 85; }).length, color: 'text-blue-600', bg: 'bg-blue-50', active: 'bg-blue-600 text-white' },
                        { id: 'Finalisation', label: 'Finalisation', count: MOCK_COURSES.filter(c => { const p = c.consumedHours / c.totalHours * 100; return p >= 86 && p <= 99; }).length, color: 'text-teal-600', bg: 'bg-teal-50', active: 'bg-teal-600 text-white' },
                        { id: 'Terminé', label: 'Terminé', count: MOCK_COURSES.filter(c => (c.consumedHours / c.totalHours * 100) >= 100).length, color: 'text-emerald-600', bg: 'bg-emerald-50', active: 'bg-emerald-600 text-white' },
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

            {/* Résumé par niveau */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['B1', 'B2', 'B3', 'M1 Hydro.'].map(lvl => {
                    const lvlCourses = MOCK_COURSES.filter(c => c.level === lvl);
                    if (lvlCourses.length === 0) return null;
                    const lvlPct = Math.round(lvlCourses.reduce((a, c) => a + c.consumedHours / c.totalHours, 0) / lvlCourses.length * 100);
                    return (
                        <button
                            key={lvl}
                            onClick={() => setSelectedLevel(selectedLevel === lvl ? 'Tous' : lvl)}
                            className={`bg-white/80 rounded-[20px] p-4 border text-left transition-all hover:shadow-md ${selectedLevel === lvl ? 'border-[#1B4332]/40 shadow-md' : 'border-[#1B4332]/10'}`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-black text-[#1B4332] uppercase">{lvl}</span>
                                <span className="text-sm font-black text-[#1B4332]">{lvlPct}%</span>
                            </div>
                            <div className="w-full bg-[#F1F8F4] rounded-full h-1.5 overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-[#52B788] to-[#74C69D] rounded-full"
                                    style={{ width: `${lvlPct}%` }} />
                            </div>
                            <p className="text-[10px] text-[#52796F] mt-1.5">{lvlCourses.length} cours · clic pour filtrer</p>
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
