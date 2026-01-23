import { useState, useEffect, useCallback } from "react";
import {
    LayoutDashboard, Users, ClipboardCheck, FileText, Calendar,
    GraduationCap, Search, Bell, ChevronDown, LogOut,
    FileCheck, X, Check, Clock, AlertCircle, Megaphone, Send, Wrench, AlertTriangle, CheckCircle, ChevronLeft, PieChart
} from "lucide-react";
import { InscriptionsManager } from "./components/InscriptionsManager";
import { AttendanceManager } from "./components/AttendanceManager";
import { GradesManager } from "./components/GradesManager";
import { ScheduleManager } from "./components/ScheduleManager";
import { StaffAssignmentManager } from "./components/StaffAssignmentManager";
import { TechnicalSupport } from "./components/TechnicalSupport";
import { ActivityHistory } from "./components/ActivityHistory";
import { StudentDemographics } from "./components/StudentDemographics";
import { userService } from "../../../services/user";
import { supportService } from "../../../services/support";

interface AcademicServiceDashboardProps {
    onLogout: () => void;
}

const navItems = [
    { id: "supervision", label: "Supervision", icon: LayoutDashboard },
    { id: "inscriptions", label: "Effectifs", icon: Users },
    { id: "charge", label: "Charge Horaire", icon: GraduationCap },
    { id: "assiduite", label: "Assiduité & Rectif.", icon: ClipboardCheck },
    { id: "notes", label: "Notes & PV", icon: FileText },
    { id: "planning", label: "Planning", icon: Calendar },
    { id: "stats_demog", label: "Stats. Étudiants", icon: PieChart },
    { id: "history", label: "Historique", icon: Clock },
];

// Note: stats sera dynamique à l'intérieur du composant, je retire la constante globale 'stats' pour la mettre dans le composant

// Note: we'll fetch real note requests in the component
// const noteRequests = ... removed

// Note: activities will be fetched dynamically
// const recentActivities = ... removed

// Note: attendanceData will be fetched dynamically

export function AcademicServiceDashboard({ onLogout }: AcademicServiceDashboardProps) {
    const [activeSection, setActiveSection] = useState("supervision");
    const [showDropdown, setShowDropdown] = useState(false);
    const [showFullYear, setShowFullYear] = useState(false);
    const [attendanceData, setAttendanceData] = useState<any[]>([]);
    const [allAttendanceStats, setAllAttendanceStats] = useState<any[]>([]);
    const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
    const [announcementTarget, setAnnouncementTarget] = useState("global");
    const [specificTarget, setSpecificTarget] = useState("");
    const [selectedNoteRequest, setSelectedNoteRequest] = useState<any>(null);
    const [showTechnicalSupport, setShowTechnicalSupport] = useState(false);
    const [realNoteRequests, setRealNoteRequests] = useState<any[]>([]);
    const [realRecentActivities, setRealRecentActivities] = useState<any[]>([]);
    const [notesLoading, setNotesLoading] = useState(true);
    const [activitiesLoading, setActivitiesLoading] = useState(true);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [supportTickets, setSupportTickets] = useState<any[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [announcementMessage, setAnnouncementMessage] = useState("");
    const [isPublishing, setIsPublishing] = useState(false);

    // Navigation Guard for Planning
    const [isPlanningModified, setIsPlanningModified] = useState(false);
    const [pendingSection, setPendingSection] = useState<string | null>(null);
    const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);
    const [onPlanningSave, setOnPlanningSave] = useState<(() => Promise<void>) | null>(null);

    const handleNavigate = (sectionId: string) => {
        if (activeSection === "planning" && isPlanningModified && sectionId !== "planning") {
            setPendingSection(sectionId);
            setShowLeaveConfirmation(true);
        } else {
            setActiveSection(sectionId);
        }
    };

    const confirmLeave = (discard: boolean) => {
        if (discard) {
            setIsPlanningModified(false);
        }
        if (pendingSection) {
            setActiveSection(pendingSection);
            setPendingSection(null);
        }
        setShowLeaveConfirmation(false);
    };

    // États pour les compteurs réels
    const [stats, setStats] = useState([
        { label: "Effectif étudiants", value: "...", change: "Total inscrits", trend: "neutral", icon: Users, bgColor: "bg-green-50", iconColor: "text-[#1B4332]" },
        { label: "Change Grade Request", value: "...", change: "Actions requises", trend: "urgent", icon: FileCheck, bgColor: "bg-orange-50", iconColor: "text-orange-500" },
        { label: "Effectif Académique", value: "...", change: "Professeurs & Ass.", trend: "neutral", icon: GraduationCap, bgColor: "bg-blue-50", iconColor: "text-blue-500" },
        { label: "Nombre de Cours", value: "...", change: "Total catalogue", trend: "neutral", icon: Calendar, bgColor: "bg-purple-50", iconColor: "text-purple-500" },
    ]);

    const fetchDashboardData = useCallback(async () => {
        try {
            // Fetch Stats
            const statsData = await userService.getAcademicStats();
            setStats([
                {
                    label: "Effectif étudiants",
                    value: statsData.studentCount.toLocaleString(),
                    change: "Total inscrits",
                    trend: "neutral",
                    icon: Users,
                    bgColor: "bg-green-50",
                    iconColor: "text-[#1B4332]"
                },
                {
                    label: "Rectifications",
                    value: statsData.pendingGradeChangeRequests.toString(),
                    change: statsData.pendingGradeChangeRequests > 0 ? "Actions requises" : "À jour",
                    trend: statsData.pendingGradeChangeRequests > 0 ? "urgent" : "neutral",
                    icon: FileCheck,
                    bgColor: "bg-orange-50",
                    iconColor: "text-orange-500"
                },
                {
                    label: "Effectif Académique",
                    value: statsData.professorCount.toLocaleString(),
                    change: "Professeurs & Ass.",
                    trend: "neutral",
                    icon: GraduationCap,
                    bgColor: "bg-blue-50",
                    iconColor: "text-blue-500"
                },
                {
                    label: "Nombre de Cours",
                    value: statsData.courseCount.toString(),
                    change: "Total catalogue",
                    trend: "neutral",
                    icon: Calendar,
                    bgColor: "bg-purple-50",
                    iconColor: "text-purple-500"
                },
            ]);

            // Fetch real pending note requests
            const { gradeService } = await import("../../../services/grade");
            const requests = await gradeService.getGradeChangeRequests();
            setRealNoteRequests(requests.filter((r: any) => r.status?.toLowerCase() === 'pending').slice(0, 3));

            // Fetch Recent Activities
            const activities = await userService.getRecentActivities();
            setRealRecentActivities(activities);

            // Fetch Attendance Stats
            const attStats = await userService.getAttendanceStats();
            setAllAttendanceStats(attStats);
            setAttendanceData(attStats.slice(0, 8)); // Par défaut 8 mois

            // Fetch Support and Notifications
            const [notifs, tickets] = await Promise.all([
                supportService.getNotifications(),
                supportService.getMyTickets()
            ]);
            setNotifications(notifs);
            setSupportTickets(tickets);
        } catch (error) {
            console.error("Erreur chargement dashboard:", error);
        } finally {
            setNotesLoading(false);
            setActivitiesLoading(false);
        }
    }, []);

    // Chargement des données réelles
    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const formatActivityTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        const diffHrs = Math.floor(diffMin / 60);
        const diffDays = Math.floor(diffHrs / 24);

        if (diffMin < 60) return `Il y a ${diffMin} min`;
        if (diffHrs < 24) return `Il y a ${diffHrs}h`;
        return `Il y a ${diffDays}j`;
    };

    const getActivityStyle = (type: string) => {
        switch (type) {
            case 'STUDENT': return { icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' };
            case 'GRADE': return { icon: FileText, color: 'text-green-500', bg: 'bg-green-50' };
            case 'SCHEDULE': return { icon: Calendar, color: 'text-purple-500', bg: 'bg-purple-50' };
            case 'ATTENDANCE': return { icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50' };
            case 'ANNOUNCEMENT': return { icon: Megaphone, color: 'text-pink-500', bg: 'bg-pink-50' };
            default: return { icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50' };
        }
    };

    const handleQuickAction = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
        try {
            const { gradeService } = await import("../../../services/grade");
            await gradeService.updateRequestStatus(requestId, status);
            setRealNoteRequests(prev => prev.filter(r => r.id !== requestId));
            setSelectedNoteRequest(null);
            // Mettre à jour le compteur dans les stats
            setStats(prev => prev.map(s =>
                s.label === "Rectifications"
                    ? { ...s, value: (parseInt(s.value) - 1).toString() }
                    : s
            ));
        } catch (error) {
            alert("Erreur lors de l'action");
        }
    };

    const toggleFullYear = () => {
        const newShowFullYear = !showFullYear;
        setShowFullYear(newShowFullYear);
        setAttendanceData(newShowFullYear ? allAttendanceStats : allAttendanceStats.slice(0, 8));
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
                            <button key={item.id} onClick={() => handleNavigate(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-[20px] transition-all ${isActive ? "bg-[#74C69D] text-[#1B4332] shadow-lg" : "text-[#FEFCF3] hover:bg-[#2D6A4F]"}`}>
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

            <div className="flex-1 overflow-y-auto bg-[#F1F8F4] custom-scrollbar">
                <header className="bg-white/60 backdrop-blur-md border-b border-[#1B4332]/10 px-6 md:px-8 py-4 relative z-30">
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

                            <div className="relative">
                                <button
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className="relative p-2 hover:bg-[#D8F3DC] rounded-[16px] transition-colors"
                                >
                                    <Bell className="w-5 h-5 text-[#1B4332]" />
                                    {notifications.filter(n => !n.isRead).length > 0 && (
                                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                    )}
                                </button>

                                {showNotifications && (
                                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-[24px] border border-[#1B4332]/10 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                        <div className="p-4 bg-[#1B4332] text-white flex justify-between items-center">
                                            <h4 className="font-bold">Notifications</h4>
                                            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">
                                                {notifications.filter(n => !n.isRead).length} nouvelles
                                            </span>
                                        </div>
                                        <div className="max-h-[400px] overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <div className="p-8 text-center text-[#52796F]">
                                                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                                    <p className="text-sm">Aucune notification</p>
                                                </div>
                                            ) : notifications.map(notif => (
                                                <div
                                                    key={notif.id}
                                                    className={`p-4 border-b border-[#1B4332]/5 hover:bg-[#F1F8F4] transition-colors cursor-pointer ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
                                                >
                                                    <div className="flex gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${notif.type === 'SUPPORT' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                                            {notif.type === 'SUPPORT' ? <Wrench className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                                                        </div>
                                                        <div>
                                                            <p className={`text-sm ${!notif.isRead ? 'font-bold text-[#1B4332]' : 'text-[#52796F]'}`}>{notif.title}</p>
                                                            <p className="text-xs text-[#52796F] mt-0.5">{notif.message}</p>
                                                            <p className="text-[10px] text-[#52796F]/50 mt-1">Il y a 2 min</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="relative">
                                <button onClick={() => setShowDropdown(!showDropdown)} className="flex items-center gap-3 bg-white rounded-[20px] px-4 py-2 border border-[#1B4332]/10 hover:shadow-md transition-all">
                                    <div className="w-9 h-9 bg-[#1B4332] rounded-full flex items-center justify-center">
                                        <span className="text-sm text-[#FEFCF3] font-bold">SA</span>
                                    </div>
                                    <div className="text-left hidden lg:block">
                                        <p className="text-sm font-medium text-[#1B4332]">Service Académique</p>
                                        <p className="text-xs text-[#52796F]">Sciences et Technologies - UNILU</p>
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

                <main className="p-6 md:p-8">
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
                                            onClick={() => isEffectifGlobal ? handleNavigate("inscriptions") : null}
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

                            {/* Section Support Technique */}
                            <div className="bg-white/40 backdrop-blur-sm rounded-[24px] p-6 border border-[#1B4332]/10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-[#1B4332] rounded-[12px] flex items-center justify-center">
                                            <Wrench className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-[#1B4332]">Tickets Support Technique</h3>
                                            <p className="text-xs text-[#52796F]">Suivi des réponses du service technique</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowTechnicalSupport(true)}
                                        className="text-sm px-4 py-2 bg-[#1B4332]/10 hover:bg-[#1B4332]/20 text-[#1B4332] rounded-[12px] transition-colors font-medium border border-[#1B4332]/10"
                                    >
                                        Nouveau Ticket
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {supportTickets.length === 0 ? (
                                        <div className="col-span-full py-6 text-center text-[#52796F] text-sm italic">
                                            Aucune demande au service technique pour le moment.
                                        </div>
                                    ) : supportTickets.slice(0, 3).map(ticket => (
                                        <div key={ticket.id} className="bg-white p-4 rounded-[20px] border border-[#1B4332]/10 hover:shadow-md transition-all group">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ticket.status === 'RESOLVED' ? 'bg-green-100 text-green-700' :
                                                    ticket.status === 'IN_PROGRESS' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {ticket.status}
                                                </span>
                                                <span className="text-[10px] text-[#52796F]">
                                                    {new Date(ticket.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <h4 className="font-bold text-[#1B4332] text-sm mb-2 line-clamp-1">{ticket.subject}</h4>
                                            {ticket.messages && ticket.messages.some((m: any) => m.isAdmin) ? (
                                                <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 p-2 rounded-lg">
                                                    <CheckCircle className="w-3 h-3" />
                                                    <span className="font-medium">Réponse reçue !</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-xs text-[#52796F] bg-gray-50 p-2 rounded-lg">
                                                    <Clock className="w-3 h-3" />
                                                    <span>En attente...</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
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
                                        {notesLoading ? (
                                            <div className="flex flex-col items-center justify-center py-10 opacity-50">
                                                <div className="w-8 h-8 border-4 border-[#1B4332] border-t-transparent rounded-full animate-spin mb-2"></div>
                                                <p className="text-sm">Vérification...</p>
                                            </div>
                                        ) : realNoteRequests.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-10 bg-[#F1F8F4] rounded-[20px] border border-dashed border-[#1B4332]/20">
                                                <CheckCircle className="w-8 h-8 text-[#1B4332] opacity-20 mb-2" />
                                                <p className="text-sm text-[#52796F]">Tout est à jour !</p>
                                            </div>
                                        ) : realNoteRequests.map((request) => (
                                            <div
                                                key={request.id}
                                                onClick={() => setSelectedNoteRequest(request)}
                                                className="bg-white rounded-[20px] p-4 border border-[#1B4332]/10 hover:border-[#1B4332]/30 transition-all cursor-pointer hover:shadow-md group"
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex items-start gap-3 flex-1">
                                                        <div className="w-10 h-10 bg-[#1B4332] text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                                                            <span>{request.professorInitials}</span>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-[#1B4332] mb-0.5">{request.professor}</p>
                                                            <p className="text-[11px] text-[#52796F] mb-3 truncate">{request.course} • {request.courseCode}</p>
                                                            <div className="flex items-center gap-4">
                                                                <div>
                                                                    <p className="text-[9px] text-[#52796F] mb-0.5 font-bold uppercase tracking-wider">INITIALE</p>
                                                                    <p className="line-through text-[#52796F] text-sm">{request.oldGrade}</p>
                                                                </div>
                                                                <div className="w-4 h-px bg-[#1B4332]/10"></div>
                                                                <div>
                                                                    <p className="text-[9px] text-[#1B4332] mb-0.5 font-bold uppercase tracking-wider">NOUVELLE</p>
                                                                    <p className="text-[#1B4332] font-black">{request.newGrade}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            onClick={() => handleQuickAction(request.id, 'REJECTED')}
                                                            className="p-2 hover:bg-red-50 rounded-[12px] transition-colors"
                                                        >
                                                            <X className="w-5 h-5 text-red-400 group-hover:text-red-600" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleQuickAction(request.id, 'APPROVED')}
                                                            className="p-2 bg-[#1B4332] hover:bg-[#2D6A4F] rounded-[12px] transition-colors"
                                                        >
                                                            <Check className="w-5 h-5 text-white" />
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
                                        {activitiesLoading ? (
                                            <div className="flex flex-col items-center justify-center py-10 opacity-50">
                                                <div className="w-8 h-8 border-4 border-[#1B4332] border-t-transparent rounded-full animate-spin mb-2"></div>
                                                <p className="text-sm text-[#52796F]">Chargement des activités...</p>
                                            </div>
                                        ) : realRecentActivities.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-10 bg-[#F1F8F4] rounded-[24px] border border-dashed border-[#1B4332]/20">
                                                <Clock className="w-8 h-8 text-[#1B4332] opacity-20 mb-2" />
                                                <p className="text-sm text-[#52796F]">Aucune activité récente</p>
                                            </div>
                                        ) : realRecentActivities.map((activity) => {
                                            const { icon: Icon, color, bg } = getActivityStyle(activity.type);
                                            return (
                                                <div key={activity.id} className="flex items-start gap-4 pb-4 border-b border-[#1B4332]/5 last:border-0 last:pb-0 group">
                                                    <div className={`w-12 h-12 ${bg} rounded-[16px] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                                                        <Icon className={`w-6 h-6 ${color}`} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between mb-0.5">
                                                            <p className="font-bold text-[#1B4332] truncate">{activity.user}</p>
                                                            <div className="flex items-center gap-1 text-[10px] text-[#52796F] font-medium whitespace-nowrap ml-2">
                                                                <Clock className="w-3 h-3" />
                                                                {formatActivityTime(activity.time)}
                                                            </div>
                                                        </div>
                                                        <p className="text-xs font-bold text-[#2D6A4F] mb-1">{activity.action}</p>
                                                        <p className="text-[11px] text-[#52796F] italic truncate opacity-80">{activity.detail}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {realRecentActivities.length > 0 && (
                                            <button
                                                onClick={() => handleNavigate("history")}
                                                className="w-full py-3 bg-[#D8F3DC]/30 hover:bg-[#D8F3DC]/60 text-[#1B4332] text-xs font-bold rounded-[16px] transition-all mt-2 uppercase tracking-widest"
                                            >
                                                Historique complet
                                            </button>
                                        )}
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

                    {activeSection === "charge" && <StaffAssignmentManager />}

                    {activeSection === "assiduite" && <AttendanceManager />}

                    {activeSection === "notes" && <GradesManager />}

                    {activeSection === "history" && (
                        <div className="h-full flex flex-col">
                            <div className="mb-4">
                                <button
                                    onClick={() => handleNavigate("supervision")}
                                    className="flex items-center gap-2 text-[#52796F] hover:text-[#1B4332] font-bold text-sm transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    Retour au Tableau de Bord
                                </button>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <ActivityHistory />
                            </div>
                        </div>
                    )}

                    {activeSection === "planning" && (
                        <ScheduleManager
                            onModifiedChange={setIsPlanningModified}
                            onSaveReady={(saveFn) => setOnPlanningSave(() => saveFn)}
                        />
                    )}

                    {activeSection === "stats_demog" && <StudentDemographics />}
                </main>

                {/* Confirm Leave Modal */}
                {showLeaveConfirmation && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
                        <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl overflow-hidden border border-red-100">
                            <div className="p-10 text-center">
                                <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <AlertTriangle className="w-10 h-10 text-red-500" />
                                </div>
                                <h3 className="text-2xl font-black text-[#1B4332] mb-3">Changements non publiés !</h3>
                                <p className="text-[#52796F] font-medium mb-8">
                                    Vous allez perdre les modifications apportées aux horaires. Voulez-vous publier avant de partir ou abandonner ?
                                </p>

                                <div className="space-y-3">
                                    <button
                                        onClick={async () => {
                                            if (onPlanningSave) {
                                                await onPlanningSave();
                                                confirmLeave(false);
                                            }
                                        }}
                                        className="w-full py-4 bg-[#1B4332] text-white font-black rounded-2xl shadow-xl shadow-[#1B4332]/20 flex items-center justify-center gap-2"
                                    >
                                        <Send className="w-5 h-5" />
                                        Publier maintenant
                                    </button>
                                    <button
                                        onClick={() => confirmLeave(true)}
                                        className="w-full py-4 bg-red-50 text-red-600 font-extrabold rounded-2xl hover:bg-red-100 transition-all uppercase tracking-wider text-sm"
                                    >
                                        Abandonner les changements
                                    </button>
                                    <button
                                        onClick={() => setShowLeaveConfirmation(false)}
                                        className="w-full py-4 text-[#52796F] font-bold"
                                    >
                                        Continuer l'édition
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

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
                                        <option value="all_students">Tous les étudiants</option>
                                        <option value="student_specific">Étudiant spécifique</option>
                                        <option value="global">Toute l'Université (Tous)</option>
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
                                    value={announcementMessage}
                                    onChange={(e) => setAnnouncementMessage(e.target.value)}
                                    className="w-full p-3 bg-[#F1F8F4] border border-[#1B4332]/10 rounded-[16px] outline-none focus:border-[#1B4332] transition-colors text-[#1B4332] resize-none"
                                ></textarea>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    onClick={() => {
                                        setShowAnnouncementModal(false);
                                        setAnnouncementMessage("");
                                    }}
                                    className="px-4 py-2 text-[#52796F] hover:bg-[#F1F8F4] rounded-[12px] font-medium transition-colors"
                                    disabled={isPublishing}
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={async () => {
                                        if (!announcementMessage.trim()) return;

                                        setIsPublishing(true);
                                        try {
                                            let target = 'ALL_STUDENTS';
                                            let levelId: number | undefined = undefined;

                                            if (announcementTarget === 'global') target = 'GLOBAL';
                                            else if (announcementTarget === 'all_students') target = 'ALL_STUDENTS';
                                            else if (announcementTarget === 'profs' || announcementTarget === 'profs_assistants') target = 'ALL_PROFESSORS';
                                            else if (announcementTarget === 'student_specific') target = 'SPECIFIC_USER';
                                            else {
                                                target = 'ACADEMIC_LEVEL';
                                                // Map to real DB IDs found in AcademicLevel table
                                                if (announcementTarget === 'prescience') levelId = 0;
                                                else if (announcementTarget === 'bac1') levelId = 1;
                                                else if (announcementTarget === 'bac2') levelId = 2;
                                                else if (announcementTarget === 'bac3') levelId = 3;
                                                // Master IDs vary by specialty, we might need a more robust mapping for them
                                                // defaulting to common IDs if they match
                                                else if (announcementTarget === 'master1') levelId = 4;
                                                else if (announcementTarget === 'master2') levelId = 7;
                                            }

                                            await userService.createAnnouncement({
                                                title: "Information Académique",
                                                content: announcementMessage,
                                                type: 'GENERAL',
                                                target: target as any,
                                                academicLevelId: levelId,
                                                targetUserId: announcementTarget === 'student_specific' ? specificTarget : undefined
                                            });

                                            setShowAnnouncementModal(false);
                                            setAnnouncementMessage("");
                                            alert("Annonce envoyée avec succès !");
                                            // Rafraîchir les données pour voir l'annonce dans l'historique
                                            fetchDashboardData();
                                        } catch (error) {
                                            alert("Erreur lors de l'envoi");
                                        } finally {
                                            setIsPublishing(false);
                                        }
                                    }}
                                    disabled={isPublishing || !announcementMessage.trim()}
                                    className="px-6 py-2 bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-[12px] font-medium flex items-center gap-2 transition-colors shadow-lg shadow-[#1B4332]/20 disabled:opacity-50"
                                >
                                    {isPublishing ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                    {isPublishing ? "Publication..." : "Publier"}
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
                                <button
                                    onClick={() => handleQuickAction(selectedNoteRequest.id, 'REJECTED')}
                                    className="flex-1 py-3 border border-red-200 hover:bg-red-50 text-red-600 rounded-[16px] font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <X className="w-4 h-4" />
                                    Refuser
                                </button>
                                <button
                                    onClick={() => handleQuickAction(selectedNoteRequest.id, 'APPROVED')}
                                    className="flex-1 py-3 bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-[16px] font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#1B4332]/20"
                                >
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
