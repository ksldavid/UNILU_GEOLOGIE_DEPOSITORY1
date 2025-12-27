import { useState } from "react";
import {
    LayoutDashboard, Users, ClipboardCheck, FileText, Calendar,
    GraduationCap, Search, Bell, ChevronDown, LogOut,
    FileCheck, X, Check, Clock, AlertCircle, Megaphone, Send, Wrench
} from "lucide-react";
import { InscriptionsManager } from "./components/InscriptionsManager";
import { AttendanceManager } from "./components/AttendanceManager";
import { GradesManager } from "./components/GradesManager";
import { ScheduleManager } from "./components/ScheduleManager";
import { TechnicalSupport } from "./components/TechnicalSupport";

interface AcademicServiceDashboardProps {
    onLogout: () => void;
}

const navItems = [
    { id: "supervision", label: "Supervision", icon: LayoutDashboard },
    { id: "inscriptions", label: "Inscriptions", icon: Users },
    { id: "assiduite", label: "Assiduité & Rectif.", icon: ClipboardCheck },
    { id: "notes", label: "Notes & PV", icon: FileText },
    { id: "planning", label: "Planning", icon: Calendar },
];

const stats = [
    { label: "Effectif étudiants", value: "2,845", change: "", trend: "neutral", icon: Users, bgColor: "bg-green-50", iconColor: "text-[#1B4332]" },
    { label: "Notes en Attente", value: "142", change: "Important", trend: "urgent", icon: FileCheck, bgColor: "bg-orange-50", iconColor: "text-orange-500" },
    { label: "Effectif Académique", value: "158", change: "", trend: "neutral", icon: GraduationCap, bgColor: "bg-blue-50", iconColor: "text-blue-500" },
    { label: "Nombre de Cours", value: "18", change: "", trend: "neutral", icon: Calendar, bgColor: "bg-purple-50", iconColor: "text-purple-500" },
];

const noteRequests = [
    { id: "1", professor: "Prof. Jean Martin", initials: "JM", course: "Mathématiques Appliquées • L2", oldGrade: "12.5", newGrade: "14.0", justification: "Erreur de comptabilisation des points de la question 3. L'étudiant mérite 1.5 points de plus." },
    { id: "2", professor: "Prof. Alice Leroy", initials: "AL", course: "Droit Constitutionnel • L1", oldGrade: "08.0", newGrade: "10.0", justification: "Réévaluation de la copie suite à la séance de consultation. La moyenne a été ajustée." },
];

const recentActivities = [
    { id: "1", student: "Alice Konan", action: "Nouvelle inscription validée", course: "Licence 1 - Géologie", time: "Il y a 5 min", icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
    { id: "2", student: "Prof. Kabeya", action: "Notes déposées", course: "Pétrologie L3", time: "Il y a 1h", icon: FileText, color: "text-green-500", bg: "bg-green-50" },
    { id: "4", student: "Service Académique", action: "Modification de planning", course: "Salle B204 - Géochimie", time: "Il y a 3h", icon: Calendar, color: "text-purple-500", bg: "bg-purple-50" },
    { id: "5", student: "Service Académique", action: "Demande changement présence", course: "Prof. Mbuyi - Géostatistique", time: "Il y a 4h", icon: Clock, color: "text-orange-500", bg: "bg-orange-50" },
    { id: "6", student: "Service Académique", action: "Refus changement note", course: "Prof. Lwamba - Tectonique", time: "Il y a 5h", icon: X, color: "text-red-500", bg: "bg-red-50" },
];

// Données réalistes de présence par mois
const generateMonthsData = (monthCount: number) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Données fixes de présence pour chaque mois (Jan=0, Déc=11)
    const attendanceByMonth: { [key: number]: { prescience: number; b1: number; b2: number; b3: number } } = {
        0: { prescience: 82, b1: 88, b2: 85, b3: 79 },  // Janvier
        1: { prescience: 84, b1: 89, b2: 87, b3: 81 },  // Février
        2: { prescience: 86, b1: 91, b2: 88, b3: 83 },  // Mars
        3: { prescience: 88, b1: 92, b2: 90, b3: 85 },  // Avril
        4: { prescience: 85, b1: 90, b2: 88, b3: 82 },  // Mai
        5: { prescience: 87, b1: 91, b2: 89, b3: 84 },  // Juin
        6: { prescience: 83, b1: 87, b2: 86, b3: 80 },  // Juillet
        7: { prescience: 84, b1: 88, b2: 87, b3: 81 },  // Août
        8: { prescience: 89, b1: 93, b2: 91, b3: 86 },  // Septembre
        9: { prescience: 91, b1: 94, b2: 92, b3: 88 },  // Octobre
        10: { prescience: 90, b1: 93, b2: 91, b3: 87 }, // Novembre
        11: { prescience: 88, b1: 92, b2: 90, b3: 85 }, // Décembre
    };

    const months = [];

    for (let i = monthCount - 1; i >= 0; i--) {
        const date = new Date(currentYear, currentMonth - i, 1);
        const monthName = date.toLocaleDateString("fr-FR", { month: "short" });
        const monthLabel = monthName.charAt(0).toUpperCase() + monthName.slice(1);
        const monthIndex = date.getMonth();

        const data = attendanceByMonth[monthIndex];

        months.push({
            month: monthLabel,
            prescience: data.prescience,
            b1: data.b1,
            b2: data.b2,
            b3: data.b3,
        });
    }

    return months;
};

export function AcademicServiceDashboard({ onLogout }: AcademicServiceDashboardProps) {
    const [activeSection, setActiveSection] = useState("supervision");
    const [showDropdown, setShowDropdown] = useState(false);
    const [showFullYear, setShowFullYear] = useState(false);
    const [attendanceData, setAttendanceData] = useState(generateMonthsData(8));
    const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
    const [announcementTarget, setAnnouncementTarget] = useState("global");
    const [specificTarget, setSpecificTarget] = useState("");
    const [selectedNoteRequest, setSelectedNoteRequest] = useState<any>(null);
    const [showTechnicalSupport, setShowTechnicalSupport] = useState(false);


    const toggleFullYear = () => {
        const newShowFullYear = !showFullYear;
        setShowFullYear(newShowFullYear);
        setAttendanceData(generateMonthsData(newShowFullYear ? 12 : 8));
    };

    const today = new Date();
    const formattedDate = today.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    return (
        <div className="flex h-screen bg-[#F1F8F4] overflow-hidden">
            <aside className="w-64 bg-[#1B4332] text-[#FEFCF3] p-6 flex flex-col">
                <div className="mb-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#74C69D] rounded-[16px] flex items-center justify-center">
                            <GraduationCap className="w-6 h-6 text-[#1B4332]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">UNILU</h2>
                            <p className="text-xs text-[#FEFCF3]/70 uppercase tracking-wider text-end">Service Académique</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeSection === item.id;
                        return (
                            <button key={item.id} onClick={() => setActiveSection(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-[20px] transition-all ${isActive ? "bg-[#74C69D] text-[#1B4332] shadow-lg" : "text-[#FEFCF3] hover:bg-[#2D6A4F]"}`}>
                                <Icon className="w-5 h-5" />
                                <span className="text-sm font-medium">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="mt-6 bg-[#2D6A4F]/50 backdrop-blur-sm rounded-[20px] p-4 border border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-[#74C69D]/20 rounded-full flex items-center justify-center">
                            <FileCheck className="w-5 h-5 text-[#74C69D]" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">Accès Sécurisé</p>
                            <p className="text-xs text-[#FEFCF3]/70">Connexion cryptée active</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowTechnicalSupport(true)}
                        className="w-full bg-white/10 hover:bg-white/20 text-[#FEFCF3] py-2 rounded-[16px] text-sm transition-colors font-medium"
                    >
                        Contacter la Technique
                    </button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white/60 backdrop-blur-md border-b border-[#1B4332]/10 px-6 md:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-[#1B4332]">Bonjour, Service Académique</h2>
                            <p className="text-sm text-[#52796F] capitalize">{formattedDate}</p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="hidden md:flex items-center gap-2 bg-[#FEFCF3] rounded-[20px] px-4 py-2 w-80 border border-[#1B4332]/10">
                                <Search className="w-4 h-4 text-[#52796F]" />
                                <input type="text" placeholder="Rechercher étudiant, CMD+K" className="bg-transparent border-none outline-none text-sm flex-1 text-[#1B4332]" />
                                <kbd className="px-2 py-0.5 bg-[#D8F3DC] rounded text-xs text-[#52796F] font-medium">⌘K</kbd>
                            </div>

                            <button
                                onClick={() => setShowAnnouncementModal(true)}
                                className="relative p-2 hover:bg-[#D8F3DC] rounded-[16px] transition-colors"
                                title="Faire une annonce"
                            >
                                <Megaphone className="w-5 h-5 text-[#1B4332]" />
                            </button>

                            <button className="relative p-2 hover:bg-[#D8F3DC] rounded-[16px] transition-colors">
                                <Bell className="w-5 h-5 text-[#1B4332]" />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            </button>

                            <div className="relative">
                                <button onClick={() => setShowDropdown(!showDropdown)} className="flex items-center gap-3 bg-white rounded-[20px] px-4 py-2 border border-[#1B4332]/10 hover:shadow-md transition-all">
                                    <div className="w-9 h-9 bg-[#1B4332] rounded-full flex items-center justify-center">
                                        <span className="text-sm text-[#FEFCF3] font-bold">SA</span>
                                    </div>
                                    <div className="text-left hidden lg:block">
                                        <p className="text-sm font-medium text-[#1B4332]">Service Académique</p>
                                        <p className="text-xs text-[#52796F]">Géologie - UNILU</p>
                                    </div>
                                    <ChevronDown className="w-4 h-4 text-[#52796F] hidden lg:block" />
                                </button>

                                {showDropdown && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl border border-[#1B4332]/10 shadow-xl py-2 z-50">
                                        <button
                                            onClick={() => setShowTechnicalSupport(true)}
                                            className="w-full text-left px-4 py-2 hover:bg-[#F1F8F4] rounded-lg text-[#1B4332] flex items-center gap-2"
                                        >
                                            <Wrench className="w-4 h-4" />
                                            Contacter la Technique
                                        </button>
                                        <button onClick={() => { setShowDropdown(false); onLogout(); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-[#D8F3DC] transition-colors text-red-600 font-medium">
                                            <LogOut className="w-4 h-4" />
                                            Se déconnecter
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6 md:p-8">
                    {activeSection === "supervision" && (
                        <div className="space-y-6">
                            <div>
                                <h1 className="text-3xl font-bold text-[#1B4332] mb-2">Tableau de Bord</h1>
                                <p className="text-[#52796F]">Vue d'ensemble du département</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                                {stats.map((stat, index) => {
                                    const Icon = stat.icon;
                                    const isEffectifGlobal = stat.label === "Effectif étudiants";

                                    return (
                                        <div
                                            key={index}
                                            onClick={() => isEffectifGlobal ? setActiveSection("inscriptions") : null}
                                            className={`bg-white/80 backdrop-blur-sm rounded-[24px] p-6 border border-[#1B4332]/10 transition-all ${isEffectifGlobal
                                                ? "cursor-pointer hover:shadow-lg hover:scale-[1.02] hover:bg-[#D8F3DC]/30"
                                                : "hover:shadow-lg"
                                                }`}
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className={`w-12 h-12 ${stat.bgColor} rounded-[16px] flex items-center justify-center`}>
                                                    <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                                                </div>
                                            </div>
                                            <h3 className="text-sm text-[#52796F] mb-1">{stat.label}</h3>
                                            <p className="text-3xl font-bold text-[#1B4332] mb-2">{stat.value}</p>
                                            <div className="flex items-center gap-1">
                                                <span className={`text-xs ${stat.trend === "urgent" ? "text-orange-500" : stat.trend === "up" ? "text-[#74C69D]" : "text-[#52796F]"}`}>{stat.change}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-white/80 backdrop-blur-sm rounded-[24px] p-6 border border-[#1B4332]/10">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h3 className="text-xl font-bold text-[#1B4332] mb-1">Rectification de notes</h3>
                                            <p className="text-sm text-[#52796F]">Demandes en attente</p>
                                        </div>
                                        <button className="text-sm text-[#1B4332] hover:underline font-medium">Voir tout</button>
                                    </div>

                                    <div className="space-y-4">
                                        {noteRequests.map((request) => (
                                            <div
                                                key={request.id}
                                                onClick={() => setSelectedNoteRequest(request)}
                                                className="bg-[#D8F3DC]/30 rounded-[20px] p-4 border border-[#1B4332]/10 hover:border-[#1B4332]/30 transition-colors cursor-pointer hover:bg-[#D8F3DC]/50"
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex items-start gap-3 flex-1">
                                                        <div className="w-10 h-10 bg-[#1B4332]/10 rounded-full flex items-center justify-center flex-shrink-0">
                                                            <span className="text-sm text-[#1B4332] font-bold">{request.initials}</span>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-[#1B4332] mb-1">{request.professor}</p>
                                                            <p className="text-sm text-[#52796F] mb-3">{request.course}</p>
                                                            <div className="flex items-center gap-4">
                                                                <div>
                                                                    <p className="text-xs text-[#52796F] mb-1 font-medium">NOTE INITIALE</p>
                                                                    <p className="line-through text-[#52796F]">{request.oldGrade}</p>
                                                                </div>
                                                                <div className="w-6 h-px bg-[#1B4332]/10"></div>
                                                                <div>
                                                                    <p className="text-xs text-[#52796F] mb-1 font-medium">NOUVELLE</p>
                                                                    <p className="text-[#1B4332] font-bold">{request.newGrade}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                                        <button className="p-2 hover:bg-red-50 rounded-[12px] transition-colors">
                                                            <X className="w-5 h-5 text-red-500" />
                                                        </button>
                                                        <button className="p-2 bg-[#1B4332] hover:bg-[#2D6A4F] rounded-[12px] transition-colors">
                                                            <Check className="w-5 h-5 text-[#FEFCF3]" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-white/80 backdrop-blur-sm rounded-[24px] p-6 border border-[#1B4332]/10">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h3 className="text-xl font-bold text-[#1B4332] mb-1">Activités Récentes</h3>
                                            <p className="text-sm text-[#52796F]">Aujourd'hui</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {recentActivities.map((activity) => {
                                            const Icon = activity.icon;
                                            return (
                                                <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-[#1B4332]/5 last:border-0 last:pb-0">
                                                    <div className={`w-10 h-10 ${activity.bg} rounded-full flex items-center justify-center flex-shrink-0`}>
                                                        <Icon className={`w-5 h-5 ${activity.color}`} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-[#1B4332] mb-1">{activity.student}</p>
                                                        <p className="text-sm text-[#52796F] mb-1">{activity.action}</p>
                                                        <p className="text-xs text-[#52796F]">{activity.course}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-xs text-[#52796F] flex-shrink-0">
                                                        <Clock className="w-3 h-3" />
                                                        {activity.time}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <button className="w-full py-2 bg-[#D8F3DC]/50 hover:bg-[#D8F3DC] text-[#1B4332] text-sm font-medium rounded-[16px] transition-colors mt-2">
                                            Voir plus
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Attendance Monitor Chart */}
                            <div className="bg-white/80 backdrop-blur-sm rounded-[24px] p-6 border border-[#1B4332]/10">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold text-[#1B4332] mb-1">Moniteur de Quotas de Présence</h3>
                                        <p className="text-sm text-[#52796F]">{showFullYear ? "Toute l'année (12 mois)" : "8 derniers mois"}</p>
                                    </div>
                                    <button onClick={toggleFullYear} className="text-sm text-[#1B4332] hover:underline font-medium transition-all">
                                        {showFullYear ? "Vue Réduite" : "Rapport Complet"}
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center justify-end gap-6 text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 bg-[#1B4332] rounded"></div>
                                            <span className="text-[#52796F]">Préscience</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 bg-[#2D6A4F] rounded"></div>
                                            <span className="text-[#52796F]">B1</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 bg-[#52B788] rounded"></div>
                                            <span className="text-[#52796F]">B2</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 bg-[#95D5B2] rounded"></div>
                                            <span className="text-[#52796F]">B3</span>
                                        </div>
                                    </div>

                                    <div className="relative h-80 flex items-end justify-between gap-3 border-b-2 border-l-2 border-[#1B4332]/20 pb-4 pl-4">
                                        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-[#52796F] -ml-8">
                                            <span>100</span>
                                            <span>75</span>
                                            <span>50</span>
                                            <span>25</span>
                                            <span>0</span>
                                        </div>

                                        {attendanceData.map((data: any, index: number) => {
                                            const maxHeight = 280; // hauteur max du conteneur en pixels
                                            const prescienceHeight = (data.prescience / 100) * maxHeight;
                                            const b1Height = (data.b1 / 100) * maxHeight;
                                            const b2Height = (data.b2 / 100) * maxHeight;
                                            const b3Height = (data.b3 / 100) * maxHeight;

                                            return (
                                                <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full justify-end min-w-[60px]">
                                                    <div className="w-full flex items-end justify-center gap-1 h-full">
                                                        <div className="flex-1 flex flex-col justify-end group relative min-w-[12px]">
                                                            <div className="bg-[#1B4332] rounded-t-lg transition-all hover:opacity-80 cursor-pointer w-full" style={{ height: `${prescienceHeight}px`, minHeight: '4px' }}>
                                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                                                    <div className="bg-[#1B4332] text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                                                                        <div className="font-bold">Préscience</div>
                                                                        <div>{data.prescience}%</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex-1 flex flex-col justify-end group relative min-w-[12px]">
                                                            <div className="bg-[#2D6A4F] rounded-t-lg transition-all hover:opacity-80 cursor-pointer w-full" style={{ height: `${b1Height}px`, minHeight: '4px' }}>
                                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                                                    <div className="bg-[#2D6A4F] text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                                                                        <div className="font-bold">B1</div>
                                                                        <div>{data.b1}%</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex-1 flex flex-col justify-end group relative min-w-[12px]">
                                                            <div className="bg-[#52B788] rounded-t-lg transition-all hover:opacity-80 cursor-pointer w-full" style={{ height: `${b2Height}px`, minHeight: '4px' }}>
                                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                                                    <div className="bg-[#52B788] text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                                                                        <div className="font-bold">B2</div>
                                                                        <div>{data.b2}%</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex-1 flex flex-col justify-end group relative min-w-[12px]">
                                                            <div className="bg-[#95D5B2] rounded-t-lg transition-all hover:opacity-80 cursor-pointer w-full" style={{ height: `${b3Height}px`, minHeight: '4px' }}>
                                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                                                    <div className="bg-[#95D5B2] text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                                                                        <div className="font-bold">B3</div>
                                                                        <div>{data.b3}%</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <span className="text-xs text-[#52796F] font-medium">{data.month}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === "inscriptions" && <InscriptionsManager />}

                    {activeSection === "assiduite" && <AttendanceManager />}

                    {activeSection === "notes" && <GradesManager />}

                    {activeSection === "planning" && <ScheduleManager />}
                </main>

                {/* Technical Support Modal */}
                {showTechnicalSupport && (
                    <div className="fixed inset-0 z-50 bg-white">
                        <div className="h-full flex flex-col">
                            <div className="bg-[#1B4332] p-6 flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                    <Wrench className="w-6 h-6" />
                                    Support Technique
                                </h2>
                                <button
                                    onClick={() => setShowTechnicalSupport(false)}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                >
                                    <X className="w-6 h-6 text-white" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 bg-[#F1F8F4]">
                                <TechnicalSupport />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal d'Annonce */}
            {showAnnouncementModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[24px] w-full max-w-lg shadow-2xl border border-[#1B4332]/10 overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-[#1B4332] p-6 text-white flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <Megaphone className="w-5 h-5" />
                                    Nouvelle Annonce
                                </h3>
                                <p className="text-[#FEFCF3]/80 text-sm mt-1">Diffuser une information importante</p>
                            </div>
                            <button onClick={() => setShowAnnouncementModal(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[#1B4332] mb-2">Cible de l'annonce</label>
                                <select
                                    value={announcementTarget}
                                    onChange={(e) => setAnnouncementTarget(e.target.value)}
                                    className="w-full p-3 bg-[#F1F8F4] border border-[#1B4332]/10 rounded-[16px] outline-none focus:border-[#1B4332] transition-colors text-[#1B4332]"
                                >
                                    <optgroup label="Classes">
                                        <option value="prescience">Préscience</option>
                                        <option value="bac1">Bachelor 1</option>
                                        <option value="bac2">Bachelor 2</option>
                                        <option value="bac3">Bachelor 3</option>
                                        <option value="master1">Master 1</option>
                                        <option value="master2">Master 2</option>
                                    </optgroup>
                                    <optgroup label="Personnel">
                                        <option value="profs">Professeurs</option>
                                        <option value="assistants">Assistants</option>
                                        <option value="profs_assistants">Professeurs & Assistants</option>
                                    </optgroup>
                                    <optgroup label="Autre">
                                        <option value="student_specific">Étudiant spécifique</option>
                                        <option value="global">Toute l'Université</option>
                                    </optgroup>
                                </select>
                            </div>

                            {announcementTarget === "student_specific" && (
                                <div className="animate-in slide-in-from-top-2 duration-200">
                                    <label className="block text-sm font-medium text-[#1B4332] mb-2">Nom de l'étudiant / Matricule</label>
                                    <div className="flex items-center gap-2 bg-[#F1F8F4] border border-[#1B4332]/10 rounded-[16px] px-3 py-1">
                                        <Search className="w-4 h-4 text-[#52796F]" />
                                        <input
                                            type="text"
                                            placeholder="Rechercher..."
                                            value={specificTarget}
                                            onChange={(e) => setSpecificTarget(e.target.value)}
                                            className="w-full p-2 bg-transparent outline-none text-[#1B4332]"
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-[#1B4332] mb-2">Message</label>
                                <textarea
                                    rows={4}
                                    placeholder="Écrivez votre annonce ici..."
                                    className="w-full p-3 bg-[#F1F8F4] border border-[#1B4332]/10 rounded-[16px] outline-none focus:border-[#1B4332] transition-colors text-[#1B4332] resize-none"
                                ></textarea>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    onClick={() => setShowAnnouncementModal(false)}
                                    className="px-4 py-2 text-[#52796F] hover:bg-[#F1F8F4] rounded-[12px] font-medium transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={() => {
                                        // Ici irait la logique d'envoi
                                        setShowAnnouncementModal(false);
                                        alert("Annonce envoyée avec succès !");
                                    }}
                                    className="px-6 py-2 bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-[12px] font-medium flex items-center gap-2 transition-colors shadow-lg shadow-[#1B4332]/20"
                                >
                                    <Send className="w-4 h-4" />
                                    Publier
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Détails Rectification Note */}
            {selectedNoteRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[24px] w-full max-w-md shadow-2xl border border-[#1B4332]/10 overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-[#1B4332] p-6 text-white flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    Détails de la demande
                                </h3>
                                <p className="text-[#FEFCF3]/80 text-sm mt-1">Rectification de note</p>
                            </div>
                            <button onClick={() => setSelectedNoteRequest(null)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-[#1B4332]/10 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-lg text-[#1B4332] font-bold">{selectedNoteRequest.initials}</span>
                                </div>
                                <div>
                                    <p className="font-bold text-[#1B4332]">{selectedNoteRequest.professor}</p>
                                    <p className="text-sm text-[#52796F]">{selectedNoteRequest.course}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 bg-[#F1F8F4] p-4 rounded-[16px]">
                                <div>
                                    <p className="text-xs text-[#52796F] mb-1 font-medium">NOTE INITIALE</p>
                                    <p className="text-lg text-[#52796F] font-mono line-through">{selectedNoteRequest.oldGrade}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-[#1B4332] mb-1 font-bold">NOUVELLE NOTE</p>
                                    <p className="text-lg text-[#1B4332] font-bold font-mono">{selectedNoteRequest.newGrade}</p>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-bold text-[#1B4332] mb-2 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    Justificatif
                                </h4>
                                <div className="bg-white border border-[#1B4332]/10 rounded-[16px] p-4 text-sm text-[#52796F] leading-relaxed">
                                    {selectedNoteRequest.justification}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button className="flex-1 py-3 border border-red-200 hover:bg-red-50 text-red-600 rounded-[16px] font-medium transition-colors flex items-center justify-center gap-2">
                                    <X className="w-4 h-4" />
                                    Refuser
                                </button>
                                <button className="flex-1 py-3 bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-[16px] font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#1B4332]/20">
                                    <Check className="w-4 h-4" />
                                    Valider
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
